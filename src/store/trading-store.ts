import { create } from 'zustand';
import type { Trade, PortfolioMetrics, SymbolMetrics, FeeBreakdown } from '@/types';
import { calculatePortfolioMetrics, generateDailyPerformance } from '@/lib/metrics';

/**
 * Zustand Store — centralized state for trading analytics.
 * Phase 7: Replaces scattered useState calls with a single,
 * observable store that any component can subscribe to.
 */

interface TradingStore {
    // --- Data ---
    trades: Trade[];
    filteredTrades: Trade[];
    portfolioMetrics: PortfolioMetrics | null;

    // --- Filter State ---
    dateRange: 'ALL' | '7D' | '30D' | '90D';
    symbolFilter: string;
    sideFilter: 'ALL' | 'LONG' | 'SHORT';
    marketTypeFilter: 'ALL' | 'spot' | 'perpetual';

    // --- UI State ---
    selectedTradeId: string | null;
    isExportModalOpen: boolean;

    // --- Actions ---
    setTrades: (trades: Trade[]) => void;
    setDateRange: (range: 'ALL' | '7D' | '30D' | '90D') => void;
    setSymbolFilter: (symbol: string) => void;
    setSideFilter: (side: 'ALL' | 'LONG' | 'SHORT') => void;
    setMarketTypeFilter: (mt: 'ALL' | 'spot' | 'perpetual') => void;
    setSelectedTradeId: (id: string | null) => void;
    setExportModalOpen: (open: boolean) => void;
    clearFilters: () => void;
}

function applyFilters(
    trades: Trade[],
    dateRange: string,
    symbolFilter: string,
    sideFilter: string,
    marketTypeFilter: string
): Trade[] {
    let result = trades;

    if (dateRange !== 'ALL') {
        const now = new Date();
        const cutoff = new Date();
        if (dateRange === '7D') cutoff.setDate(now.getDate() - 7);
        if (dateRange === '30D') cutoff.setDate(now.getDate() - 30);
        if (dateRange === '90D') cutoff.setDate(now.getDate() - 90);
        result = result.filter(t => new Date(t.timestamp) >= cutoff);
    }

    if (symbolFilter !== 'ALL') {
        result = result.filter(t => t.symbol === symbolFilter);
    }
    if (sideFilter !== 'ALL') {
        result = result.filter(t => t.side === sideFilter);
    }
    if (marketTypeFilter !== 'ALL') {
        result = result.filter(t => t.marketType === marketTypeFilter);
    }

    return result;
}

export const useTradingStore = create<TradingStore>((set, get) => ({
    // Data
    trades: [],
    filteredTrades: [],
    portfolioMetrics: null,

    // Filters
    dateRange: 'ALL',
    symbolFilter: 'ALL',
    sideFilter: 'ALL',
    marketTypeFilter: 'ALL',

    // UI
    selectedTradeId: null,
    isExportModalOpen: false,

    // Actions
    setTrades: (trades) => {
        const state = get();
        const filtered = applyFilters(trades, state.dateRange, state.symbolFilter, state.sideFilter, state.marketTypeFilter);
        const metrics = calculatePortfolioMetrics(filtered);
        set({ trades, filteredTrades: filtered, portfolioMetrics: metrics });
    },

    setDateRange: (dateRange) => {
        const state = get();
        const filtered = applyFilters(state.trades, dateRange, state.symbolFilter, state.sideFilter, state.marketTypeFilter);
        const metrics = calculatePortfolioMetrics(filtered);
        set({ dateRange, filteredTrades: filtered, portfolioMetrics: metrics });
    },

    setSymbolFilter: (symbolFilter) => {
        const state = get();
        const filtered = applyFilters(state.trades, state.dateRange, symbolFilter, state.sideFilter, state.marketTypeFilter);
        const metrics = calculatePortfolioMetrics(filtered);
        set({ symbolFilter, filteredTrades: filtered, portfolioMetrics: metrics });
    },

    setSideFilter: (sideFilter) => {
        const state = get();
        const filtered = applyFilters(state.trades, state.dateRange, state.symbolFilter, sideFilter, state.marketTypeFilter);
        const metrics = calculatePortfolioMetrics(filtered);
        set({ sideFilter, filteredTrades: filtered, portfolioMetrics: metrics });
    },

    setMarketTypeFilter: (marketTypeFilter) => {
        const state = get();
        const filtered = applyFilters(state.trades, state.dateRange, state.symbolFilter, state.sideFilter, marketTypeFilter);
        const metrics = calculatePortfolioMetrics(filtered);
        set({ marketTypeFilter, filteredTrades: filtered, portfolioMetrics: metrics });
    },

    setSelectedTradeId: (selectedTradeId) => set({ selectedTradeId }),
    setExportModalOpen: (isExportModalOpen) => set({ isExportModalOpen }),

    clearFilters: () => {
        const state = get();
        const metrics = calculatePortfolioMetrics(state.trades);
        set({
            dateRange: 'ALL',
            symbolFilter: 'ALL',
            sideFilter: 'ALL',
            marketTypeFilter: 'ALL',
            filteredTrades: state.trades,
            portfolioMetrics: metrics,
        });
    },
}));
