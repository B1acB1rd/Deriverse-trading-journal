'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, List, Filter, Download, Search, AlertCircle } from 'lucide-react';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { useTradeData } from '../../hooks/useTradeData';
import { Trade } from '../../types';
import { TradeDetailModal } from '@/components/journal/TradeDetailModal';

export default function JournalPage() {
    const { trades, isLoading } = useTradeData();
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

    // Initial simple filtering (expand later)
    const filteredTrades = trades.filter(t =>
        t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.strategyId && t.strategyId.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                <div>
                    <h2 className="text-xl font-bold text-white">Trade Logbook</h2>
                    <p className="text-sm text-text-muted">{trades.length} entries recorded</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-solana-purple text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-solana-purple text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                        >
                            <Calendar className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder="Search by Symbol or Strategy..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-solana-purple outline-none w-64"
                        />
                    </div>

                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-colors">
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solana-purple"></div>
                    </div>
                ) : filteredTrades.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                        <AlertCircle className="w-12 h-12 text-white/20 mb-4" />
                        <p className="text-white/40">No trades found matching your criteria</p>
                    </div>
                ) : (
                    viewMode === 'list' ? (
                        <div className="glass-panel overflow-hidden rounded-2xl">
                            <table className="w-full">
                                <thead className="bg-white/5 border-b border-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Symbol</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Side</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Size</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Strategy</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Psychology</th>
                                        <th className="px-6 py-4 text-right text-xs font-medium text-white/40 uppercase tracking-wider">PnL</th>
                                        <th className="px-6 py-4 text-center text-xs font-medium text-white/40 uppercase tracking-wider">Journal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredTrades.map((trade) => (
                                        <tr
                                            key={trade.id}
                                            onClick={() => setSelectedTrade(trade)}
                                            className="hover:bg-white/5 cursor-pointer transition-colors group"
                                        >
                                            <td className="px-6 py-4 text-sm text-white/60">
                                                {new Date(trade.timestamp).toLocaleDateString()}
                                                <div className="text-xs text-white/20">{new Date(trade.timestamp).toLocaleTimeString()}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-white">{trade.symbol}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${trade.side === 'LONG' ? 'bg-solana-green/10 text-solana-green' : 'bg-red-500/10 text-red-500'
                                                    }`}>
                                                    {trade.side}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-white font-mono">
                                                {trade.size.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {trade.strategyId ? (
                                                    <span className="px-2 py-1 bg-white/10 rounded text-xs text-white">{trade.strategyId}</span>
                                                ) : (
                                                    <span className="text-white/20 text-xs italic">--</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-1">
                                                    {(trade.emotions || []).slice(0, 2).map(e => (
                                                        <span key={e} className="px-1.5 py-0.5 border border-white/10 rounded text-[10px] text-white/60">{e}</span>
                                                    ))}
                                                    {(trade.emotions?.length || 0) > 2 && <span className="text-xs text-white/40">...</span>}
                                                </div>
                                            </td>
                                            <td className={`px-6 py-4 text-right font-mono text-sm ${trade.pnl >= 0 ? 'text-solana-green' : 'text-red-500'}`}>
                                                {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className={`w-2 h-2 rounded-full mx-auto ${trade.isJournaled ? 'bg-solana-green shadow-[0_0_10px_rgba(20,241,149,0.5)]' : 'bg-white/10'}`} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
