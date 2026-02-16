export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_MARKET' | 'STOP_LIMIT';
export type Side = 'LONG' | 'SHORT';
export type TradeSide = Side; // Alias for v2 compatibility
export type MarketType = 'spot' | 'perpetual' | 'options';
export type TradeStatus = 'OPEN' | 'CLOSED' | 'LIQUIDATED';
export type LiquidityTier = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Trade {
    id: string;
    wallet: string;
    symbol: string;
    side: Side;
    orderType: OrderType;
    price: number;
    size: number;
    // Financials
    fees: number;
    feesUsd?: number;
    pnl: number;
    realizedPnl: number;
    unrealizedPnl: number;
    // Execution details
    slippage: number;
    timestamp: string; // ISO String
    isOnChain: boolean;
    chainTx?: string;
    liquidityTier: LiquidityTier;
    // --- Journaling Fields (Mutable) ---
    manualEntryPrice?: number; // Override for unknown entry price
    manualFees?: number; // Override for missing fees
    strategyId?: string; // ID of the setup used (e.g., "breakout")
    notes?: string; // Free text notes

    // Psychology
    emotions?: string[]; // e.g., ["Confident", "Anxious", "FOMO"]
    disciplineScore?: number; // 1-10 rating of adherence to plan

    // Forensics / Analysis
    mistakes?: string[]; // e.g., ["Chased", "Wide Stop"]
    lessons?: string[]; // Key takeaways
    marketContext?: string; // "CPI release", "Low volume"

    // Evidence
    screenshots?: string[]; // URLs to chart images
    riskRewardRatio?: number; // Planned R:R

    // Status
    isJournaled: boolean; // Computed flag: true if any journal fields are filled
    status?: 'OPEN' | 'CLOSED' | 'PENDING';
    // Time metrics
    duration: number; // in seconds
    // MEV
    isMEVSuspect: boolean;
    // Confidence score for MEV (0-1)
    mevConfidence?: number;
    // Deriverse Specific
    markPrice?: number;
    leverage?: number;
    positionType?: string;

    // v2 Analytics Fields
    marketType?: MarketType;
    entryPrice?: number;
    exitPrice?: number;
    entryTime?: string;
    exitTime?: string;
    tags?: string[];
}

export interface VerificationSnapshot {
    id: string;
    date: string;
    tradeCount: number;
    merkleRoot: string;
    status: 'simulated' | 'verified';
    timestamp: string;
}

export interface TraderProfile {
    style: 'Scalper' | 'Swing' | 'Position';
    bias: 'Long' | 'Short' | 'Balanced';
    bestSession: string; // e.g., "NY Open", "Asia"
    risk: 'High' | 'Medium' | 'Low';
    weakness: string;
}

export interface PnLAttribution {
    grossPnL: number;
    feesPaid: number;
    slippageLoss: number;
    netPnL: number;
}

// ── Per-Symbol Analytics ──

export interface SymbolMetrics {
    symbol: string;
    pnl: number;
    volume: number;
    tradeCount: number;
    winRate: number;
    averagePnl: number;
    fees: number;
}

// ── Session Analytics ──

export interface SessionMetrics {
    session: 'Asian' | 'European' | 'American';
    pnl: number;
    tradeCount: number;
    winRate: number;
}

// ── Hourly Analytics ──

export interface HourlyMetrics {
    hour: number;
    pnl: number;
    tradeCount: number;
    winRate: number;
}

// ── Fee Breakdown ──

export interface FeeBreakdown {
    makerFees: number;
    takerFees: number;
    fundingFees: number;
    totalFees: number;
    feesOverTime: Array<{
        date: Date;
        fees: number;
        cumulativeFees: number;
    }>;
}

// ── Analytics v2 Interfaces ──

export interface PortfolioMetrics {
    totalPnl: number;
    totalPnlPercentage: number;
    totalVolume: number;
    totalFees: number;
    winRate: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    averageWin: number;
    averageLoss: number;
    largestWin: number;
    largestLoss: number;
    profitFactor: number;
    averageTradeDuration: number;
    longShortRatio: number;
    maxDrawdown: number;
    maxDrawdownPercentage: number;
    sharpeRatio?: number;
}

export interface DailyPerformance {
    date: Date;
    pnl: number;
    cumulativePnl: number;
    volume: number;
    fees: number;
    tradeCount: number;
    winCount: number;
    lossCount: number;
    drawdown: number;
    drawdownPercentage: number;
}

export interface FilterOptions {
    dateRange: {
        start: Date | null;
        end: Date | null;
    };
    symbols: string[];
    marketTypes: MarketType[];
    sides: Side[];
    status: TradeStatus[];
    minPnl?: number;
    maxPnl?: number;
    timeframe?: string; // e.g. '1D', '1W', 'ALL'
}
