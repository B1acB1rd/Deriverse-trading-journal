import { Trade, PnLAttribution, SymbolMetrics, SessionMetrics, HourlyMetrics, FeeBreakdown, PortfolioMetrics, DailyPerformance } from '@/types';

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

// ── Per-Symbol Metrics ──

/**
 * Breakdown of PnL, volume, win rate, and fees per trading symbol.
 * Similar to the reference project's calculateSymbolMetrics but uses our Trade type.
 */
export function calculateSymbolMetrics(trades: Trade[]): SymbolMetrics[] {
    const symbolData = new Map<string, {
        pnl: number; volume: number; fees: number; wins: number; total: number;
    }>();

    for (const trade of trades) {
        const existing = symbolData.get(trade.symbol);
        const volume = (trade.price || 0) * (trade.size || 0);
        const pnl = trade.pnl || 0;
        const isWin = pnl > 0;
        const fee = Math.abs(trade.fees || 0);

        if (existing) {
            existing.pnl += pnl;
            existing.volume += volume;
            existing.fees += fee;
            existing.total += 1;
            if (isWin) existing.wins += 1;
        } else {
            symbolData.set(trade.symbol, {
                pnl,
                volume,
                fees: fee,
                wins: isWin ? 1 : 0,
                total: 1,
            });
        }
    }

    return Array.from(symbolData.entries())
        .map(([symbol, data]) => ({
            symbol,
            pnl: data.pnl,
            volume: data.volume,
            tradeCount: data.total,
            winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0,
            averagePnl: data.total > 0 ? data.pnl / data.total : 0,
            fees: data.fees,
        }))
        .sort((a, b) => b.volume - a.volume);
}

// ── Session Metrics ──

/**
 * Performance broken down by trading session:
 *   Asian:    00:00 – 08:00 UTC
 *   European: 08:00 – 16:00 UTC
 *   American: 16:00 – 24:00 UTC
 */
export function calculateSessionMetrics(trades: Trade[]): SessionMetrics[] {
    const sessions: Record<string, { pnl: number; wins: number; total: number }> = {
        Asian: { pnl: 0, wins: 0, total: 0 },
        European: { pnl: 0, wins: 0, total: 0 },
        American: { pnl: 0, wins: 0, total: 0 },
    };

    for (const trade of trades) {
        const hour = new Date(trade.timestamp).getUTCHours();
        let session: string;

        if (hour >= 0 && hour < 8) session = 'Asian';
        else if (hour >= 8 && hour < 16) session = 'European';
        else session = 'American';

        const pnl = trade.pnl || 0;
        sessions[session].pnl += pnl;
        sessions[session].total += 1;
        if (pnl > 0) sessions[session].wins += 1;
    }

    return (Object.entries(sessions) as [string, { pnl: number; wins: number; total: number }][]).map(
        ([session, data]) => ({
            session: session as 'Asian' | 'European' | 'American',
            pnl: data.pnl,
            tradeCount: data.total,
            winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0,
        })
    );
}

// ── Hourly Metrics ──

/**
 * PnL and win rate broken down by hour of day (0-23 UTC).
 * Useful for identifying the best/worst hours to trade.
 */
export function calculateHourlyMetrics(trades: Trade[]): HourlyMetrics[] {
    const hourlyData: { pnl: number; wins: number; total: number }[] =
        Array.from({ length: 24 }, () => ({ pnl: 0, wins: 0, total: 0 }));

    for (const trade of trades) {
        const hour = new Date(trade.timestamp).getUTCHours();
        const pnl = trade.pnl || 0;
        hourlyData[hour].pnl += pnl;
        hourlyData[hour].total += 1;
        if (pnl > 0) hourlyData[hour].wins += 1;
    }

    return hourlyData.map((data, hour) => ({
        hour,
        pnl: data.pnl,
        tradeCount: data.total,
        winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0,
    }));
}

// ── Fee Breakdown ──

/**
 * Categorize total fees by type (maker rebates, taker fees, funding fees).
 * Uses trade.fees as taker, trade.feesUsd as total, and checks positionType for funding.
 */
export function calculateFeeBreakdown(trades: Trade[]): FeeBreakdown {
    let makerFees = 0;
    let takerFees = 0;
    let fundingFees = 0;
    const feesOverTime: { date: Date; fees: number; cumulativeFees: number }[] = [];

    // Sort trades by timestamp for cumulative calculation
    const sortedTrades = [...trades].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    let cumulativeFees = 0;

    for (const trade of sortedTrades) {
        const pt = (trade.positionType || '').toLowerCase();
        const fee = Math.abs(trade.fees || 0);

        if (pt === 'funding') {
            fundingFees += fee;
        } else {
            // For spot/perp, fees are taker by default on Deriverse DEX
            // Maker rebates show as negative fees from Tag 15
            if ((trade.fees || 0) < 0) {
                makerFees += Math.abs(trade.fees || 0); // rebate (negative)
            } else {
                takerFees += fee;
            }
        }

        cumulativeFees += fee;
        feesOverTime.push({
            date: new Date(trade.timestamp),
            fees: fee,
            cumulativeFees
        });
    }

    return {
        makerFees,
        takerFees, // Includes taker fees and other costs
        fundingFees,
        totalFees: makerFees + takerFees + fundingFees,
        feesOverTime
    };
}

// ── Unified Analytics Engine (v2) ──

/**
 * Calculates a comprehensive set of portfolio metrics in a single pass.
 * Returns 17 key metrics including PnL, Win Rate, Profit Factor, Drawdown, etc.
 */
export function calculatePortfolioMetrics(trades: Trade[]): PortfolioMetrics {
    const closedTrades = trades.filter(t => t.status === 'CLOSED' || t.status === undefined); // Assume undefined is closed legacy

    if (closedTrades.length === 0) {
        return {
            totalPnl: 0,
            totalPnlPercentage: 0,
            totalVolume: 0,
            totalFees: 0,
            winRate: 0,
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            averageWin: 0,
            averageLoss: 0,
            largestWin: 0,
            largestLoss: 0,
            profitFactor: 0,
            averageTradeDuration: 0,
            longShortRatio: 0,
            maxDrawdown: 0,
            maxDrawdownPercentage: 0,
        };
    }

    // Initialize accumulators
    let totalPnl = 0;
    let totalVolume = 0;
    let totalFees = 0;
    let winningTrades = 0;
    let losingTrades = 0;
    let totalWins = 0;
    let totalLosses = 0;
    let largestWin = 0;
    let largestLoss = 0;
    let longCount = 0;
    let shortCount = 0;
    let totalDuration = 0;
    let durationCount = 0;

    // For Drawdown
    let currentEquity = 0;
    let peakEquity = 0;
    let maxDrawdown = 0;

    // Sort for drawdown calculation correctness
    const sortedTrades = [...closedTrades].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    for (const trade of sortedTrades) {
        const pnl = trade.pnl || 0;
        const volume = (trade.price || 0) * (trade.size || 0);
        const fee = trade.fees || 0;

        totalPnl += pnl;
        totalVolume += volume;
        totalFees += fee;

        if (pnl > 0) {
            winningTrades++;
            totalWins += pnl;
            largestWin = Math.max(largestWin, pnl);
        } else if (pnl < 0) {
            losingTrades++;
            totalLosses += Math.abs(pnl);
            largestLoss = Math.max(largestLoss, Math.abs(pnl));
        }

        if (trade.side === 'LONG') longCount++;
        else if (trade.side === 'SHORT') shortCount++;

        // Duration (sanity check for valid timestamps)
        if (trade.entryTime && trade.exitTime) {
            const duration = new Date(trade.exitTime).getTime() - new Date(trade.entryTime).getTime();
            if (duration > 0) {
                totalDuration += duration;
                durationCount++;
            }
        } else if (trade.duration) {
            totalDuration += trade.duration * 1000; // Assuming trade.duration is seconds
            durationCount++;
        }

        // Drawdown
        currentEquity += pnl;
        if (currentEquity > peakEquity) peakEquity = currentEquity;
        const dd = peakEquity - currentEquity;
        if (dd > maxDrawdown) maxDrawdown = dd;
    }

    const profitFactor = totalLosses === 0 ? (totalWins > 0 ? Infinity : 0) : totalWins / totalLosses;
    const maxDrawdownPercentage = peakEquity > 0 ? (maxDrawdown / peakEquity) * 100 : 0;

    // Calculate Sharpe Ratio (approximate)
    const sharpeRatio = calculateSharpeRatio(closedTrades) || 0;

    return {
        totalPnl,
        totalPnlPercentage: totalVolume > 0 ? (totalPnl / totalVolume) * 100 : 0,
        totalVolume,
        totalFees,
        winRate: closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0,
        totalTrades: closedTrades.length,
        winningTrades,
        losingTrades,
        averageWin: winningTrades > 0 ? totalWins / winningTrades : 0,
        averageLoss: losingTrades > 0 ? totalLosses / losingTrades : 0,
        largestWin,
        largestLoss,
        profitFactor,
        averageTradeDuration: durationCount > 0 ? totalDuration / durationCount : 0,
        longShortRatio: shortCount > 0 ? longCount / shortCount : longCount > 0 ? Infinity : 0,
        maxDrawdown,
        maxDrawdownPercentage,
        sharpeRatio,
    };
}

/**
 * Aggregates trades into daily performance buckets for equity charts.
 */
export function generateDailyPerformance(trades: Trade[]): DailyPerformance[] {
    const dailyMap = new Map<string, DailyPerformance>();
    const closedTrades = trades.filter(t => (t.status === 'CLOSED' || t.status === undefined) && t.pnl !== undefined);

    for (const trade of closedTrades) {
        // Use exitTime if available, else timestamp
        const timeStr = trade.exitTime || trade.timestamp;
        const dateKey = new Date(timeStr).toISOString().split('T')[0];
        const existing = dailyMap.get(dateKey);

        const pnl = trade.pnl || 0;
        const volume = (trade.price || 0) * (trade.size || 0);
        const fees = trade.fees || 0;

        if (existing) {
            existing.pnl += pnl;
            existing.volume += volume;
            existing.fees += fees;
            existing.tradeCount += 1;
            if (pnl > 0) existing.winCount += 1;
            else existing.lossCount += 1;
        } else {
            dailyMap.set(dateKey, {
                date: new Date(dateKey),
                pnl,
                cumulativePnl: 0, // Calculated later
                volume,
                fees,
                tradeCount: 1,
                winCount: pnl > 0 ? 1 : 0,
                lossCount: pnl <= 0 ? 1 : 0,
                drawdown: 0,
                drawdownPercentage: 0,
            });
        }
    }

    // Sort by date and calculate cumulative values
    const sorted = Array.from(dailyMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());

    let cumulative = 0;
    let peak = 0;

    for (const day of sorted) {
        cumulative += day.pnl;
        day.cumulativePnl = cumulative;

        if (cumulative > peak) peak = cumulative;

        day.drawdown = peak - cumulative;
        day.drawdownPercentage = peak > 0 ? (day.drawdown / peak) * 100 : 0;
    }

    return sorted;
}
