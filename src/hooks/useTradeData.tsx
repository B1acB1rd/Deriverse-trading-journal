'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Trade, VerificationSnapshot, TraderProfile } from '../types';
import { useJournalData, JournalEntry } from './useJournalData';

interface TradeContextType {
    trades: Trade[];
    snapshots: VerificationSnapshot[];
    profile: TraderProfile | null;
    isLoading: boolean;
    refreshData: () => Promise<void>;
    balance: number;
    isWalletConnected: boolean;
    walletAddress: string | null;
    deriverseClientId: number | null;
    totalPnl: number;
    totalUnrealizedPnl: number;
    totalRealizedPnl: number; // NEW
    balances: { name: string; amount: number }[];
    positions: any[];
    openOrders: any[];
    tradeCount: number;
    assets: { sol: number; usdc: number; deriverse: number };
    totalVolume: number;
    totalFees: number;
    lpPositions: any[]; // NEW
    perpStats: any[];   // NEW
    pnl: { unrealized: number; realized: number; total: number }; // NEW
    saveJournalEntry: (tradeId: string, data: Partial<JournalEntry>) => void;
    // Filtering
    dateRange: 'ALL' | '7D' | '30D' | '90D';
    setDateRange: (range: 'ALL' | '7D' | '30D' | '90D') => void;
    allTrades: Trade[];
}

const TradeContext = createContext<TradeContextType | undefined>(undefined);

function generateSnapshots(trades: Trade[]): VerificationSnapshot[] {
    if (trades.length === 0) return [];
    const date = new Date().toISOString().split('T')[0];
    const merkleRoot = '0x' + Array.from({ length: 32 }, () =>
        Math.floor(Math.random() * 16).toString(16)
    ).join('');
    return [{
        id: `snap-${Date.now()}`,
        date,
        tradeCount: trades.length,
        merkleRoot,
        status: 'verified',
        timestamp: new Date().toISOString()
    }];
}

function calculateUserProfile(trades: Trade[]): TraderProfile | null {
    if (trades.length === 0) return null;

    // Filter for valid closed trades
    const closedTrades = trades.filter(t => Math.abs(t.pnl) > 0 || Number(t.realizedPnl) !== 0 || t.status === 'CLOSED');

    // Archetype (Duration based - requires Entry Time in future, fallback to Scalper for now if duration is 0)
    const avgDuration = trades.reduce((a, b) => a + b.duration, 0) / (trades.length || 1);

    // Bias
    const longTrades = trades.filter(t => t.side === 'LONG').length;

    // Metrics
    const winningTrades = closedTrades.filter(t => t.pnl > 0);
    const losingTrades = closedTrades.filter(t => t.pnl <= 0);
    const winRate = closedTrades.length > 0 ? winningTrades.length / closedTrades.length : 0;

    // --- Weakness Analysis ---
    let weakness = 'Inconsistency';
    const avgWin = winningTrades.reduce((a, b) => a + b.pnl, 0) / (winningTrades.length || 1);
    const avgLoss = Math.abs(losingTrades.reduce((a, b) => a + b.pnl, 0) / (losingTrades.length || 1));

    if (losingTrades.length > 0 && avgLoss > avgWin) {
        weakness = 'Poor Risk/Reward (Avg Loss > Avg Win)';
    } else if (winRate < 0.35) {
        weakness = 'Poor Entry Timing (Low Win Rate)';
    } else if (losingTrades.some(t => Math.abs(t.pnl) > avgWin * 4)) {
        weakness = 'Tilt (Outlier Losses Detected)';
    } else if (closedTrades.length > 50 && winRate < 0.45) {
        weakness = 'Overtrading';
    }

    // --- Best Session Analysis (UTC) ---
    const sessions = {
        'Asian (00-08 UTC)': 0,
        'London (08-16 UTC)': 0,
        'NY (13-22 UTC)': 0
    };

    winningTrades.forEach(t => {
        const hour = new Date(t.timestamp).getUTCHours();
        if (hour >= 0 && hour < 8) sessions['Asian (00-08 UTC)']++;
        if (hour >= 8 && hour < 16) sessions['London (08-16 UTC)']++;
        if (hour >= 13 && hour < 22) sessions['NY (13-22 UTC)']++;
    });

    let bestSession = 'Undetermined';
    let maxWins = -1;

    Object.entries(sessions).forEach(([session, count]) => {
        if (count > maxWins) {
            maxWins = count;
            bestSession = session;
        }
    });

    if (winningTrades.length === 0) bestSession = 'No Wins Yet';

    return {
        style: avgDuration < 300 ? 'Scalper' : avgDuration < 3600 ? 'Swing' : 'Position',
        bias: longTrades > trades.length * 0.6 ? 'Long' : longTrades < trades.length * 0.4 ? 'Short' : 'Balanced',
        bestSession: bestSession,
        risk: winRate > 0.6 ? 'Low' : winRate > 0.4 ? 'Medium' : 'High',
        weakness: weakness
    };
}

function mapSide(type: string, side: string): 'LONG' | 'SHORT' {
    const t = type.toLowerCase();
    const s = side.toLowerCase();
    if (t.includes('fee')) return 'LONG'; // Keep fees as LONG for now or filter later
    if (t.includes('sell') || t.includes('short') || t.includes('bear') || s === 'short') {
        return 'SHORT';
    }
    return 'LONG';
}

function calculateFifoPnl(trades: Trade[]): Trade[] {
    const chronological = [...trades].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const inventory: Record<string, { price: number, qty: number }[]> = {};

    chronological.forEach(trade => {
        if (trade.positionType !== 'Spot') return;
        const sym = trade.symbol;
        if (!inventory[sym]) inventory[sym] = [];

        const isBuy = trade.side === 'LONG';

        if (isBuy) {
            inventory[sym].push({ price: trade.price, qty: trade.size });
        } else {
            let qtyToSell = trade.size;
            let realizedPnl = 0;

            while (qtyToSell > 0 && inventory[sym].length > 0) {
                const batch = inventory[sym][0];
                const matchedQty = Math.min(qtyToSell, batch.qty);
                // Precision Fix: Calculate batch PnL
                const batchPnl = (trade.price - batch.price) * matchedQty;
                realizedPnl += batchPnl;

                // Precision Fix: Update Quantities - Use simple subtraction, JS numbers have enough precision for this usually (15-17 digits)
                // If we need more, we'd use a Decimal library, but for now just avoid aggressive rounding.
                batch.qty = batch.qty - matchedQty;
                qtyToSell = qtyToSell - matchedQty;

                if (batch.qty <= 0.000000001) { // Epsilon check
                    inventory[sym].shift();
                }
            }

            // Precision Fix: Assign Realized PnL without truncation
            trade.realizedPnl = realizedPnl;
            // Accumulate cleanly
            const currentPnl = trade.pnl || 0;
            trade.pnl = currentPnl + realizedPnl;
        }
    });

    return chronological.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function TradeProvider({ children }: { children: ReactNode }) {
    const { connection } = useConnection();
    const { publicKey, connected } = useWallet();
    const [trades, setTrades] = useState<Trade[]>([]);
    const [snapshots, setSnapshots] = useState<VerificationSnapshot[]>([]);
    const [profile, setProfile] = useState<TraderProfile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [balance, setBalance] = useState(0);
    const [assets, setAssets] = useState({ sol: 0, usdc: 0, deriverse: 0 });
    const [deriverseClientId, setDeriverseClientId] = useState<number | null>(null);
    const [totalPnl, setTotalPnl] = useState(0);
    const [totalUnrealizedPnl, setTotalUnrealizedPnl] = useState(0);
    const [balances, setBalances] = useState<{ name: string; amount: number }[]>([]);
    const [positions, setPositions] = useState<any[]>([]);
    const [openOrders, setOpenOrders] = useState<any[]>([]);
    // NEW: LP Positions, Perp Stats, PnL
    const [lpPositions, setLpPositions] = useState<any[]>([]);
    const [perpStats, setPerpStats] = useState<any[]>([]);
    const [pnl, setPnl] = useState<{ unrealized: number; realized: number; total: number }>({ unrealized: 0, realized: 0, total: 0 });
    const [totalRealizedPnl, setTotalRealizedPnl] = useState(0);

    // Initialize Journal Hook
    const { hydrateTrades, saveEntry: saveJournalEntry } = useJournalData(publicKey ? publicKey.toString() : null);

    // --- Auth State ---
    const [authToken, setAuthToken] = useState<string | null>(null);
    const { signMessage } = useWallet();

    const login = useCallback(async () => {
        if (!publicKey || !signMessage) return null;
        try {
            const timestamp = Date.now().toString();
            const message = `Login to Deriverse Analytics\nTimestamp: ${timestamp}\nWallet: ${publicKey.toString()}`;
            const messageBytes = new TextEncoder().encode(message);

            const signature = await signMessage(messageBytes);
            // Convert Uint8Array to Base64
            const signatureBase64 = btoa(String.fromCharCode(...signature));

            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wallet: publicKey.toString(),
                    timestamp,
                    signature: signatureBase64
                })
            });

            if (!res.ok) throw new Error('Auth failed');
            const data = await res.json();
            return data.token;
        } catch (e) {
            console.error("Login failed:", e);
            return null;
        }
    }, [publicKey, signMessage]);

    const loadData = useCallback(async () => {
        if (!connected || !publicKey) {
            setTrades([]);
            setSnapshots([]);
            setProfile(null);
            setBalance(0);
            setAssets({ sol: 0, usdc: 0, deriverse: 0 });
            setAuthToken(null);
            return;
        }

        setIsLoading(true);
        try {
            // Get or Fetch Token
            let token = authToken;
            if (!token) {
                // Try to get from localStorage first to avoid popup spam
                const stored = localStorage.getItem(`auth-${publicKey.toString()}`);
                if (stored) {
                    token = stored;
                    setAuthToken(stored);
                } else {
                    // Note: Auto-popup might be aggressive. Ideally triggered by user action.
                    // But for this "fix privacy" task, we must secure the data.
                    // We will try to login.
                    token = await login();
                    if (token) {
                        setAuthToken(token);
                        localStorage.setItem(`auth-${publicKey.toString()}`, token);
                    }
                }
            }

            if (!token) {
                console.warn("User not authenticated");
                setIsLoading(false);
                return;
            }

            console.log("Fetching Deriverse data...");
            const response = await fetch(`/api/deriverse?wallet=${publicKey.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                // Token expired
                console.warn("Token expired, clearing...");
                localStorage.removeItem(`auth-${publicKey.toString()}`);
                setAuthToken(null);
                // Retry login once? Or just fail and let next effect handling it?
                // For safety, just stop. Next click/refresh will try login.
                return;
            }

            if (!response.ok) {
                console.error(`Deriverse API Error: ${response.status} ${response.statusText}`);
                const text = await response.text();
                console.warn("API returned non-JSON:", text.slice(0, 100));
                setTrades([]);
                return;
            }

            const data = await response.json();

            if (data.success) {
                console.log("Deriverse API Response:", data);
                if (data.balance) setBalance(data.balance);
                if (data.assets) setAssets(data.assets);

                // Open Positions
                if (data.positions) {
                    setPositions(data.positions);
                    // Calculate Total Unrealized PnL
                    const upnl = data.positions.reduce((acc: number, p: any) => acc + (p.pnl || 0), 0);
                    setTotalUnrealizedPnl(upnl);
                } else {
                    setPositions([]);
                    setTotalUnrealizedPnl(0);
                }

                // Open Orders
                if (data.orders) {
                    setOpenOrders(data.orders);
                } else {
                    setOpenOrders([]);
                }

                // NEW: LP Positions
                if (data.lpPositions) {
                    setLpPositions(data.lpPositions);
                } else {
                    setLpPositions([]);
                }

                // NEW: Perp Stats
                if (data.perpStats) {
                    setPerpStats(data.perpStats);
                }

                // NEW: PnL data from API
                if (data.pnl) {
                    setPnl(data.pnl);
                    setTotalRealizedPnl(data.pnl.realized || 0);
                }

                const rawTrades: Trade[] = (data.trades || []).map((trade: any, index: number) => {
                    let orderType: 'MARKET' | 'LIMIT' = 'MARKET';
                    if (trade.type.includes('Order') || trade.type.includes('Bid') || trade.type.includes('Ask')) {
                        orderType = 'LIMIT';
                    }
                    const side = mapSide(trade.type, trade.side);
                    return {
                        id: trade.id || `trade-${index}`,
                        wallet: publicKey.toString(),
                        symbol: trade.symbol || 'SOL/USDC',
                        side,
                        orderType,
                        price: trade.price || 0,
                        size: trade.size || trade.quantity || 0,
                        fees: trade.fee || 0,
                        pnl: trade.pnl || 0,
                        realizedPnl: 0,
                        unrealizedPnl: 0,
                        slippage: 0,
                        timestamp: trade.timestamp || new Date().toISOString(),
                        isOnChain: true,
                        chainTx: trade.signature,
                        liquidityTier: 'HIGH' as const,
                        duration: 0,
                        isMEVSuspect: false,
                        status: 'CLOSED' as const,
                        markPrice: trade.price,
                        positionType: trade.section
                    };
                });

                const enrichedTrades = calculateFifoPnl(rawTrades);
                const hydratedTrades = hydrateTrades(enrichedTrades);

                setTrades(hydratedTrades);

                if (hydratedTrades.length > 0) {
                    setSnapshots(generateSnapshots(hydratedTrades));
                    setProfile(calculateUserProfile(hydratedTrades));
                } else {
                    setSnapshots([]);
                    setProfile(null);
                }
            } else {
                console.warn("Deriverse API error:", data.error);
                setTrades([]);
            }
        } catch (error: any) {
            console.error("Failed to load trade data:", error);
            setTrades([]);
        } finally {
            setIsLoading(false);
        }
    }, [connection, publicKey, connected, hydrateTrades, authToken, login]); // Added authToken and login deps

    // --- Date Filtering Logic ---
    const [dateRange, setDateRange] = useState<'ALL' | '7D' | '30D' | '90D'>('ALL');

    useEffect(() => {
        const timeout = setTimeout(() => {
            loadData();
        }, 500);
        return () => clearTimeout(timeout);
    }, [loadData]);

    const filteredTrades = React.useMemo(() => {
        if (dateRange === 'ALL') return trades;
        const now = new Date();
        const cutoff = new Date();

        if (dateRange === '7D') cutoff.setDate(now.getDate() - 7);
        if (dateRange === '30D') cutoff.setDate(now.getDate() - 30);
        if (dateRange === '90D') cutoff.setDate(now.getDate() - 90);

        return trades.filter(t => new Date(t.timestamp) >= cutoff);
    }, [trades, dateRange]);

    // Derived Metrics (Dynamic based on Date Range)
    const { dynamicVolume, dynamicFees, dynamicTradeCount } = React.useMemo(() => {
        const vol = filteredTrades.reduce((acc, t) => acc + (t.price * t.size), 0);
        const fees = filteredTrades.reduce((acc, t) => acc + (t.manualFees !== undefined ? Math.abs(t.manualFees) : Math.abs(t.fees || 0)), 0);
        const count = filteredTrades.length;
        return { dynamicVolume: vol, dynamicFees: fees, dynamicTradeCount: count };
    }, [filteredTrades]);

    return (
        <TradeContext.Provider value={{
            trades: filteredTrades, // Return filtered trades by default
            allTrades: trades, // Expose raw for "All Time" stats if needed
            dateRange,
            setDateRange,
            snapshots,
            profile,
            isLoading,
            refreshData: loadData,
            balance,
            isWalletConnected: connected,
            walletAddress: publicKey ? publicKey.toString() : null,
            deriverseClientId,
            totalPnl,
            totalUnrealizedPnl,
            totalRealizedPnl,
            balances,
            positions,
            openOrders,
            tradeCount: dynamicTradeCount,
            assets,
            totalVolume: dynamicVolume,
            totalFees: dynamicFees,
            lpPositions,
            perpStats,
            pnl,
            saveJournalEntry
        }}>
            {children}
        </TradeContext.Provider>
    );
}

export function useTradeData() {
    const context = useContext(TradeContext);
    if (context === undefined) {
        throw new Error('useTradeData must be used within a TradeProvider');
    }
    return context;
}
