'use client';

import React, { useMemo, useState } from 'react';
import { useTradeData } from '@/hooks/useTradeData';
import { formatCurrency, cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Calculator, X, TrendingUp, TrendingDown } from 'lucide-react';
import { Trade } from '@/types';

function getDaysInMonth(year: number, month: number) {
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
        days.push(new Date(date));
        date.setDate(date.getDate() + 1);
    }
    return days;
}

function TradePreview({ trade }: { trade: Trade }) {
    const isWin = (trade.pnl || 0) >= 0;
    return (
        <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg mb-2 text-sm">
            <div className="flex flex-col">
                <span className="font-bold text-text-primary">{trade.symbol}</span>
                <span className={`text-[10px] uppercase font-bold ${trade.side === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.side}
                </span>
            </div>
            <div className="text-right">
                <div className={`font-mono font-bold ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                    {isWin ? '+' : ''}{formatCurrency(trade.pnl || 0)}
                </div>
                <div className="text-xs text-text-muted opacity-60">
                    Size: {trade.size.toFixed(2)}
                </div>
            </div>
        </div>
    );
}

export function CalendarGrid() {
    const { trades, isWalletConnected } = useTradeData();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const dailyStats = useMemo(() => {
        const stats: Record<string, { pnl: number, count: number, wins: number, trades: Trade[] }> = {};

        trades.forEach(trade => {
            const dateStr = new Date(trade.timestamp).toLocaleDateString('en-CA');
            if (!stats[dateStr]) {
                stats[dateStr] = { pnl: 0, count: 0, wins: 0, trades: [] };
            }
            stats[dateStr].pnl += (trade.pnl || 0);
            stats[dateStr].count += 1;
            if ((trade.pnl || 0) > 0) stats[dateStr].wins += 1;
            stats[dateStr].trades.push(trade);
        });

        return stats;
    }, [trades]);

    const days = getDaysInMonth(year, month);
    const firstDay = days[0];
    const startingBlankDays = firstDay.getDay();

    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const selectedDateStr = selectedDate?.toLocaleDateString('en-CA');
    const selectedStats = selectedDateStr ? dailyStats[selectedDateStr] : null;

    if (!isWalletConnected) {
        return (
            <div className="glass-panel p-12 rounded-xl text-center flex flex-col items-center justify-center min-h-[400px]">
                <Calculator size={48} className="text-text-muted mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-text-primary mb-2">Calendar Locked</h3>
                <p className="text-text-muted">Connect wallet to view performance heatmap.</p>
            </div>
        );
    }

    return (
        <div className="glass-panel rounded-xl p-3 md:p-6 relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 md:mb-8">
                <h2 className="text-lg md:text-2xl font-bold text-text-primary">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex gap-1 md:gap-2">
                    <button onClick={handlePrevMonth} className="p-1.5 md:p-2 hover:bg-white/5 rounded-full transition"><ChevronLeft size={18} /></button>
                    <button onClick={handleNextMonth} className="p-1.5 md:p-2 hover:bg-white/5 rounded-full transition"><ChevronRight size={18} /></button>
                </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 md:gap-3 mb-2 md:mb-4 text-center text-text-muted text-[10px] md:text-xs font-bold uppercase tracking-wider">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
            </div>

            {/* Grid Body */}
            <div className="grid grid-cols-7 gap-1 md:gap-3">
                {/* Blanks */}
                {Array.from({ length: startingBlankDays }).map((_, i) => (
                    <div key={`blank-${i}`} className="aspect-square md:h-28 bg-transparent rounded-lg" />
                ))}

                {/* Days */}
                {days.map((date) => {
                    const dateStr = date.toLocaleDateString('en-CA');
                    const stats = dailyStats[dateStr];
                    const pnl = stats?.pnl || 0;
                    const count = stats?.count || 0;
                    const isToday = dateStr === new Date().toLocaleDateString('en-CA');

                    let bgClass = "bg-white/5 hover:bg-white/10";
                    let textClass = "text-text-muted";

                    if (stats) {
                        if (pnl > 0) {
                            bgClass = "bg-green-500/20 border border-green-500/30 hover:bg-green-500/30";
                            textClass = "text-green-400";
                        } else if (pnl < 0) {
                            bgClass = "bg-red-500/20 border border-red-500/30 hover:bg-red-500/30";
                            textClass = "text-red-400";
                        } else {
                            bgClass = "bg-brand-primary/20 border border-brand-primary/30";
                            textClass = "text-brand-accent";
                        }
                    }

                    if (isToday) {
                        bgClass += " ring-2 ring-brand-primary";
                    }

                    return (
                        <div
                            key={dateStr}
                            onClick={() => stats && count > 0 && setSelectedDate(date)}
                            className={cn(
                                "aspect-square md:h-28 rounded-lg p-1.5 md:p-3 flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden group",
                                bgClass
                            )}
                        >
                            <div className="flex justify-between items-start">
                                <span className={cn("text-[10px] md:text-xs font-bold", isToday ? "text-brand-accent bg-brand-primary/20 px-1 py-0.5 rounded" : "text-text-muted")}>
                                    {date.getDate()}
                                </span>
                                {count > 0 && (
                                    <span className="text-[8px] md:text-[10px] text-text-muted bg-black/20 px-1 md:px-1.5 py-0.5 rounded-full">
                                        {count}
                                    </span>
                                )}
                            </div>

                            {stats && (
                                <div className="text-right">
                                    <div className={cn("text-[9px] md:text-sm font-bold font-mono tracking-tight leading-tight", textClass)}>
                                        {formatCurrency(pnl)}
                                    </div>
                                    <div className="text-[7px] md:text-[10px] text-text-muted opacity-70 hidden md:block">
                                        {stats.wins}W / {count - stats.wins}L
                                    </div>
                                </div>
                            )}

                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors pointer-events-none" />
                        </div>
                    );
                })}
            </div>

            {/* Detail Modal */}
            {selectedDate && selectedStats && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedDate(null)} />
                    <div className="bg-[#0b0c15] border border-white/10 w-full max-w-md rounded-xl shadow-2xl relative z-20 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="p-4 md:p-6 border-b border-white/5 flex justify-between items-center bg-white/5 rounded-t-xl shrink-0">
                            <div>
                                <h3 className="text-lg md:text-xl font-bold text-text-primary">
                                    {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                                </h3>
                                <p className={`text-sm font-mono font-bold ${selectedStats.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    Day PnL: {formatCurrency(selectedStats.pnl)}
                                </p>
                            </div>
                            <button onClick={() => setSelectedDate(null)} className="p-2 hover:bg-white/10 rounded-full transition text-text-muted">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 md:p-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
                                <div className="bg-white/5 p-3 rounded-lg text-center">
                                    <div className="text-xs text-text-muted">Trades</div>
                                    <div className="text-lg font-bold text-text-primary">{selectedStats.count}</div>
                                </div>
                                <div className="bg-white/5 p-3 rounded-lg text-center">
                                    <div className="text-xs text-text-muted">Win Rate</div>
                                    <div className="text-lg font-bold text-text-primary">
                                        {selectedStats.count > 0 ? ((selectedStats.wins / selectedStats.count) * 100).toFixed(0) : 0}%
                                    </div>
                                </div>
                            </div>

                            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Trade Log</h4>
                            {selectedStats.trades.map((trade, i) => (
                                <TradePreview key={i} trade={trade} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
