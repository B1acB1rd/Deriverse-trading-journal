import { Trade, PnLAttribution } from '@/types';

// ── Basic Metrics ──

export function calculateGaslessSavings(trades: Trade[], baselinePerTrade: number = 20): number {
    const feesPaid = trades.reduce((acc, t) => acc + (t.fees || 0), 0);
    const slippagePaid = trades.reduce((acc, t) => acc + (t.slippage || 0), 0);
    const estimatedBaseline = baselinePerTrade * trades.length;
    return estimatedBaseline - (feesPaid + slippagePaid);
}

export function calculatePnLAttribution(trades: Trade[]): PnLAttribution {
    const grossPnL = trades.reduce((acc, t) => acc + (t.pnl + (t.fees || 0) + (t.slippage || 0)), 0);
    const feesPaid = trades.reduce((acc, t) => acc + (t.fees || 0), 0);
    const slippageLoss = trades.reduce((acc, t) => acc + (t.slippage || 0), 0);
    const netPnL = grossPnL - feesPaid - slippageLoss;
    return { grossPnL, feesPaid, slippageLoss, netPnL };
}

export function computeSlippageStats(trades: Trade[], window: number = 20) {
    if (trades.length === 0) return { mean: 0, std: 0 };
    const recentTrades = trades.slice(-window);
    const values = recentTrades.map(t => t.slippage || 0);
    const count = values.length;
    if (count === 0) return { mean: 0, std: 0 };
    const mean = values.reduce((a, b) => a + b, 0) / count;
    const varianceDivider = count > 1 ? count - 1 : 1;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / varianceDivider;
    return { mean, std: Math.sqrt(variance) };
}

// ── Advanced Quant Metrics (from Audit Report) ──

/**
 * Profit Factor = Gross Wins / Gross Losses
 * A value > 1.5 is generally considered good.
 */
export function calculateProfitFactor(trades: Trade[]): number {
    const grossWins = trades.reduce((sum, t) => sum + (t.pnl > 0 ? t.pnl : 0), 0);
    const grossLosses = Math.abs(trades.reduce((sum, t) => sum + (t.pnl < 0 ? t.pnl : 0), 0));
    if (grossLosses === 0) return grossWins > 0 ? Infinity : 0;
    return grossWins / grossLosses;
}

/**
 * Expectancy = Average dollar value per trade.
 * Positive expectancy means the system is profitable on average.
 */
export function calculateExpectancy(trades: Trade[]): number {
    if (trades.length === 0) return 0;
    const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    return totalPnl / trades.length;
}

/**
 * Group trades into daily returns for ratio calculations.
 */
function getDailyReturns(trades: Trade[]): number[] {
    const dailyMap: Record<string, number> = {};
    trades.forEach(t => {
        const dateStr = new Date(t.timestamp).toLocaleDateString('en-CA');
        dailyMap[dateStr] = (dailyMap[dateStr] || 0) + (t.pnl || 0);
    });
    return Object.values(dailyMap);
}

/**
 * Sharpe Ratio = Mean Daily Return / StdDev of Daily Returns * sqrt(252)
 * Annualized. Requires at least 2 trading days.
 */
export function calculateSharpeRatio(trades: Trade[]): number | null {
    const dailyReturns = getDailyReturns(trades);
    if (dailyReturns.length < 2) return null;

    const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (dailyReturns.length - 1);
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return mean > 0 ? Infinity : 0;
    return (mean / stdDev) * Math.sqrt(252);
}

/**
 * Sortino Ratio = Mean Daily Return / Downside Deviation * sqrt(252)
 * Only penalizes negative returns (downside risk).
 */
export function calculateSortinoRatio(trades: Trade[]): number | null {
    const dailyReturns = getDailyReturns(trades);
    if (dailyReturns.length < 2) return null;

    const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const negativeReturns = dailyReturns.filter(r => r < 0);

    if (negativeReturns.length === 0) return mean > 0 ? Infinity : 0;

    const downsideVariance = negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length;
    const downsideDev = Math.sqrt(downsideVariance);

    if (downsideDev === 0) return mean > 0 ? Infinity : 0;
    return (mean / downsideDev) * Math.sqrt(252);
}

/**
 * Max Drawdown — peak-to-trough decline in cumulative PnL.
 * Returns both dollar amount and percentage.
 */
export function calculateMaxDrawdown(trades: Trade[]): { maxDrawdown: number; maxDrawdownPercent: number; drawdownSeries: number[] } {
    if (trades.length === 0) return { maxDrawdown: 0, maxDrawdownPercent: 0, drawdownSeries: [] };

    // Sort by timestamp
    const sorted = [...trades].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let cumPnl = 0;
    let peak = 0;
    let maxDD = 0;
    const drawdownSeries: number[] = [];

    for (const trade of sorted) {
        cumPnl += (trade.pnl || 0);
        if (cumPnl > peak) peak = cumPnl;
        const dd = peak - cumPnl;
        if (dd > maxDD) maxDD = dd;
        drawdownSeries.push(dd);
    }

    const maxDDPercent = peak > 0 ? (maxDD / peak) * 100 : 0;

    return { maxDrawdown: maxDD, maxDrawdownPercent: maxDDPercent, drawdownSeries };
}

// ── Behavioral Analysis ──

export interface RevengeTrade {
    tradeId: string;
    symbol: string;
    timestamp: string;
    pnl: number;
    triggeredBy: string; // ID of the losing trade that triggered re-entry
    timeBetweenMinutes: number;
}

/**
 * Revenge Trading Detection:
 * Flag a trade if it opens within 10 minutes of a losing trade
 * on the same symbol and also loses.
 */
export function detectRevengeTrading(trades: Trade[]): RevengeTrade[] {
    if (trades.length < 2) return [];

    const sorted = [...trades].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const revengeTrades: RevengeTrade[] = [];

    for (let i = 1; i < sorted.length; i++) {
        const curr = sorted[i];
        const prev = sorted[i - 1];

        if (prev.pnl >= 0 || curr.pnl >= 0) continue; // Both must be losses
        if (prev.symbol !== curr.symbol) continue; // Same symbol

        const timeDiff = new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime();
        const timeDiffMinutes = timeDiff / (1000 * 60);

        if (timeDiffMinutes <= 10) {
            revengeTrades.push({
                tradeId: curr.id,
                symbol: curr.symbol,
                timestamp: curr.timestamp,
                pnl: curr.pnl,
                triggeredBy: prev.id,
                timeBetweenMinutes: Math.round(timeDiffMinutes * 10) / 10
            });
        }
    }

    return revengeTrades;
}

export interface Streak {
    type: 'winning' | 'losing';
    length: number;
    totalPnl: number;
    startIndex: number;
    endIndex: number;
}

/**
 * Detect consecutive winning/losing streaks > 3 trades.
 */
export function detectStreaks(trades: Trade[]): Streak[] {
    if (trades.length < 3) return [];

    const sorted = [...trades].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const streaks: Streak[] = [];

    let currentType: 'winning' | 'losing' | null = null;
    let streakStart = 0;
    let streakPnl = 0;

    for (let i = 0; i < sorted.length; i++) {
        const isWin = (sorted[i].pnl || 0) > 0;
        const tradeType = isWin ? 'winning' : 'losing';

        if (tradeType === currentType) {
            streakPnl += sorted[i].pnl || 0;
        } else {
            // End previous streak if it was long enough
            if (currentType && (i - streakStart) >= 3) {
                streaks.push({
                    type: currentType,
                    length: i - streakStart,
                    totalPnl: streakPnl,
                    startIndex: streakStart,
                    endIndex: i - 1
                });
            }
            currentType = tradeType;
            streakStart = i;
            streakPnl = sorted[i].pnl || 0;
        }
    }

    // Check final streak
    if (currentType && (sorted.length - streakStart) >= 3) {
        streaks.push({
            type: currentType,
            length: sorted.length - streakStart,
            totalPnl: streakPnl,
            startIndex: streakStart,
            endIndex: sorted.length - 1
        });
    }

    return streaks;
}

/**
 * Performance Trend: Compare last 20 trades vs prior 20 trades.
 * Returns "Improving", "Stable", or "Declining".
 */
export function calculatePerformanceTrend(trades: Trade[]): {
    trend: 'Improving' | 'Stable' | 'Declining';
    recentWinRate: number;
    previousWinRate: number;
    recentAvgPnl: number;
    previousAvgPnl: number;
} | null {
    if (trades.length < 10) return null;

    const sorted = [...trades].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const windowSize = Math.min(20, Math.floor(sorted.length / 2));

    const recentTrades = sorted.slice(-windowSize);
    const previousTrades = sorted.slice(-(windowSize * 2), -windowSize);

    if (previousTrades.length === 0) return null;

    const recentWins = recentTrades.filter(t => (t.pnl || 0) > 0).length;
    const previousWins = previousTrades.filter(t => (t.pnl || 0) > 0).length;

    const recentWinRate = (recentWins / recentTrades.length) * 100;
    const previousWinRate = (previousWins / previousTrades.length) * 100;

    const recentAvgPnl = recentTrades.reduce((s, t) => s + (t.pnl || 0), 0) / recentTrades.length;
    const previousAvgPnl = previousTrades.reduce((s, t) => s + (t.pnl || 0), 0) / previousTrades.length;

    // Determine trend based on both win rate and avg PnL changes
    const winRateDelta = recentWinRate - previousWinRate;
    const pnlImproving = recentAvgPnl > previousAvgPnl;

    let trend: 'Improving' | 'Stable' | 'Declining';
    if (winRateDelta > 5 || (winRateDelta > -2 && pnlImproving)) {
        trend = 'Improving';
    } else if (winRateDelta < -5 || (winRateDelta < 2 && !pnlImproving && recentAvgPnl < previousAvgPnl * 0.8)) {
        trend = 'Declining';
    } else {
        trend = 'Stable';
    }

    return { trend, recentWinRate, previousWinRate, recentAvgPnl, previousAvgPnl };
}
