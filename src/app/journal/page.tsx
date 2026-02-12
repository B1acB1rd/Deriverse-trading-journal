'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, List, Filter, Download, Search, AlertCircle, X, ChevronDown } from 'lucide-react';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { useTradeData } from '../../hooks/useTradeData';
import { Trade } from '../../types';
import { TradeDetailModal } from '@/components/journal/TradeDetailModal';

export default function JournalPage() {
    const { trades, isLoading } = useTradeData();
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    // Filter state
    const [filterSide, setFilterSide] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');
    const [filterResult, setFilterResult] = useState<'ALL' | 'WINNERS' | 'LOSERS'>('ALL');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');

    const activeFilterCount = [
        filterSide !== 'ALL',
        filterResult !== 'ALL',
        filterDateFrom !== '',
        filterDateTo !== ''
    ].filter(Boolean).length;

    const clearFilters = () => {
        setFilterSide('ALL');
        setFilterResult('ALL');
        setFilterDateFrom('');
        setFilterDateTo('');
    };

    const filteredTrades = useMemo(() => {
        return trades.filter(t => {
            // Search filter
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchesSymbol = t.symbol.toLowerCase().includes(q);
                const matchesStrategy = t.strategyId?.toLowerCase().includes(q);
                if (!matchesSymbol && !matchesStrategy) return false;
            }

            // Side filter
            if (filterSide !== 'ALL' && t.side !== filterSide) return false;

            // PnL result filter
            if (filterResult === 'WINNERS' && (t.pnl || 0) <= 0) return false;
            if (filterResult === 'LOSERS' && (t.pnl || 0) >= 0) return false;

            // Date range filter
            if (filterDateFrom) {
                const fromDate = new Date(filterDateFrom);
                fromDate.setHours(0, 0, 0, 0);
                if (new Date(t.timestamp) < fromDate) return false;
            }
            if (filterDateTo) {
                const toDate = new Date(filterDateTo);
                toDate.setHours(23, 59, 59, 999);
                if (new Date(t.timestamp) > toDate) return false;
            }

            return true;
        });
    }, [trades, searchQuery, filterSide, filterResult, filterDateFrom, filterDateTo]);

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header / Controls */}
            <div className="flex flex-col gap-3 bg-white/5 p-3 md:p-4 rounded-2xl border border-white/5">
                {/* Top row: Title + View Toggle */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-lg md:text-xl font-bold text-white">Trade Logbook</h2>
                        <p className="text-xs md:text-sm text-text-muted">{trades.length} entries recorded</p>
                    </div>
                    <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 md:p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-solana-purple text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                        >
                            <List className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`p-1.5 md:p-2 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-solana-purple text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                        >
                            <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    </div>
                </div>

                {/* Search + Filter button row */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder="Search by Symbol or Strategy..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-solana-purple outline-none"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm transition-colors shrink-0 ${activeFilterCount > 0
                                ? 'bg-solana-purple/20 border-solana-purple/50 text-solana-purple'
                                : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                            }`}
                    >
                        <Filter className="w-4 h-4" />
                        <span className="hidden sm:inline">Filters</span>
                        {activeFilterCount > 0 && (
                            <span className="bg-solana-purple text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Collapsible Filter Panel */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-black/30 border border-white/10 rounded-xl p-3 md:p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Filter Options</span>
                                    {activeFilterCount > 0 && (
                                        <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                                            Clear All
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    {/* Side Filter */}
                                    <div>
                                        <label className="block text-[10px] text-text-muted uppercase mb-1">Side</label>
                                        <select
                                            value={filterSide}
                                            onChange={(e) => setFilterSide(e.target.value as any)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-solana-purple outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="ALL">All Sides</option>
                                            <option value="LONG">Long Only</option>
                                            <option value="SHORT">Short Only</option>
                                        </select>
                                    </div>

                                    {/* Result Filter */}
                                    <div>
                                        <label className="block text-[10px] text-text-muted uppercase mb-1">Result</label>
                                        <select
                                            value={filterResult}
                                            onChange={(e) => setFilterResult(e.target.value as any)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-solana-purple outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="ALL">All Results</option>
                                            <option value="WINNERS">Winners Only</option>
                                            <option value="LOSERS">Losers Only</option>
                                        </select>
                                    </div>

                                    {/* Date From */}
                                    <div>
                                        <label className="block text-[10px] text-text-muted uppercase mb-1">From Date</label>
                                        <input
                                            type="date"
                                            value={filterDateFrom}
                                            onChange={(e) => setFilterDateFrom(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-solana-purple outline-none"
                                        />
                                    </div>

                                    {/* Date To */}
                                    <div>
                                        <label className="block text-[10px] text-text-muted uppercase mb-1">To Date</label>
                                        <input
                                            type="date"
                                            value={filterDateTo}
                                            onChange={(e) => setFilterDateTo(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-solana-purple outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px] md:min-h-[500px]">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solana-purple"></div>
                    </div>
                ) : filteredTrades.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 md:py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                        <AlertCircle className="w-10 h-10 md:w-12 md:h-12 text-white/20 mb-4" />
                        <p className="text-white/40 text-sm md:text-base">No trades found matching your criteria</p>
                        {activeFilterCount > 0 && (
                            <button onClick={clearFilters} className="mt-3 text-xs text-solana-purple hover:text-solana-purple/80 transition-colors">
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    viewMode === 'list' ? (
                        <div className="glass-panel overflow-hidden rounded-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[700px]">
                                    <thead className="bg-white/5 border-b border-white/5">
                                        <tr>
                                            <th className="px-3 md:px-6 py-3 md:py-4 text-left text-[10px] md:text-xs font-medium text-white/40 uppercase tracking-wider">Date</th>
                                            <th className="px-3 md:px-6 py-3 md:py-4 text-left text-[10px] md:text-xs font-medium text-white/40 uppercase tracking-wider">Symbol</th>
                                            <th className="px-3 md:px-6 py-3 md:py-4 text-left text-[10px] md:text-xs font-medium text-white/40 uppercase tracking-wider">Side</th>
                                            <th className="px-3 md:px-6 py-3 md:py-4 text-left text-[10px] md:text-xs font-medium text-white/40 uppercase tracking-wider">Size</th>
                                            <th className="px-3 md:px-6 py-3 md:py-4 text-left text-[10px] md:text-xs font-medium text-white/40 uppercase tracking-wider">Strategy</th>
                                            <th className="px-3 md:px-6 py-3 md:py-4 text-left text-[10px] md:text-xs font-medium text-white/40 uppercase tracking-wider">Psychology</th>
                                            <th className="px-3 md:px-6 py-3 md:py-4 text-right text-[10px] md:text-xs font-medium text-white/40 uppercase tracking-wider">PnL</th>
                                            <th className="px-3 md:px-6 py-3 md:py-4 text-center text-[10px] md:text-xs font-medium text-white/40 uppercase tracking-wider">Journal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredTrades.map((trade) => (
                                            <tr
                                                key={trade.id}
                                                onClick={() => setSelectedTrade(trade)}
                                                className="hover:bg-white/5 cursor-pointer transition-colors group"
                                            >
                                                <td className="px-3 md:px-6 py-3 md:py-4 text-sm text-white/60">
                                                    {new Date(trade.timestamp).toLocaleDateString()}
                                                    <div className="text-xs text-white/20">{new Date(trade.timestamp).toLocaleTimeString()}</div>
                                                </td>
                                                <td className="px-3 md:px-6 py-3 md:py-4 text-sm font-medium text-white">{trade.symbol}</td>
                                                <td className="px-3 md:px-6 py-3 md:py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${trade.side === 'LONG' ? 'bg-solana-green/10 text-solana-green' : 'bg-red-500/10 text-red-500'
                                                        }`}>
                                                        {trade.side}
                                                    </span>
                                                </td>
                                                <td className="px-3 md:px-6 py-3 md:py-4 text-sm text-white font-mono">
                                                    {trade.size.toFixed(2)}
                                                </td>
                                                <td className="px-3 md:px-6 py-3 md:py-4">
                                                    {trade.strategyId ? (
                                                        <span className="px-2 py-1 bg-white/10 rounded text-xs text-white">{trade.strategyId}</span>
                                                    ) : (
                                                        <span className="text-white/20 text-xs italic">--</span>
                                                    )}
                                                </td>
                                                <td className="px-3 md:px-6 py-3 md:py-4">
                                                    <div className="flex gap-1">
                                                        {(trade.emotions || []).slice(0, 2).map(e => (
                                                            <span key={e} className="px-1.5 py-0.5 border border-white/10 rounded text-[10px] text-white/60">{e}</span>
                                                        ))}
                                                        {(trade.emotions?.length || 0) > 2 && <span className="text-xs text-white/40">...</span>}
                                                    </div>
                                                </td>
                                                <td className={`px-3 md:px-6 py-3 md:py-4 text-right font-mono text-sm ${trade.pnl >= 0 ? 'text-solana-green' : 'text-red-500'}`}>
                                                    {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                                                </td>
                                                <td className="px-3 md:px-6 py-3 md:py-4 text-center">
                                                    <div className={`w-2 h-2 rounded-full mx-auto ${trade.isJournaled ? 'bg-solana-green shadow-[0_0_10px_rgba(20,241,149,0.5)]' : 'bg-white/10'}`} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            <CalendarGrid />
                        </div>
                    )
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {selectedTrade && (
                    <TradeDetailModal
                        trade={selectedTrade}
                        onClose={() => setSelectedTrade(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
