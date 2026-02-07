import { Trade, PnLAttribution } from '@/types';

export function calculateGaslessSavings(trades: Trade[], baselinePerTrade: number = 20): number {
    // baselinePerTrade: assumed cost per trade on L1 (USD) for comparison
    const feesPaid = trades.reduce((acc, t) => acc + (t.fees || 0), 0);
    const slippagePaid = trades.reduce((acc, t) => acc + (t.slippage || 0), 0);
    const estimatedBaseline = baselinePerTrade * trades.length;
    // Savings = (What you would have paid) - (What you actually paid including hidden costs)
    return estimatedBaseline - (feesPaid + slippagePaid);
}

export function calculatePnLAttribution(trades: Trade[]): PnLAttribution {
    // grossPnL: what the PnL would be before execution costs
    const grossPnL = trades.reduce((acc, t) => acc + (t.pnl + (t.fees || 0) + (t.slippage || 0)), 0);
    const feesPaid = trades.reduce((acc, t) => acc + (t.fees || 0), 0);
    const slippageLoss = trades.reduce((acc, t) => acc + (t.slippage || 0), 0);
    const netPnL = grossPnL - feesPaid - slippageLoss;

    return {
        grossPnL,
        feesPaid,
        slippageLoss,
        netPnL,
    };
}

export function computeSlippageStats(trades: Trade[], window: number = 20) {
    if (trades.length === 0) return { mean: 0, std: 0 };

    // Use the most recent 'window' trades
    const recentTrades = trades.slice(-window);
    const values = recentTrades.map(t => t.slippage || 0);

    const count = values.length;
    if (count === 0) return { mean: 0, std: 0 };

    const mean = values.reduce((a, b) => a + b, 0) / count;

    // Use sample variance (n-1) if count > 1, else 0
    const varianceDivider = count > 1 ? count - 1 : 1;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / varianceDivider;

    return { mean, std: Math.sqrt(variance) };
}
