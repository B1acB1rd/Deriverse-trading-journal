'use client';

import React, { useMemo } from 'react';
import { useTradeData } from '@/hooks/useTradeData';

export function ProjectionsCard() {
    const { trades, isLoading, totalRealizedPnl } = useTradeData();

    const projections = useMemo(() => {
        // Use realized PnL from perp stats if available, otherwise sum trade PnLs
        const tradePnl = trades.reduce((acc, t) => acc + (t.pnl || 0), 0);
        const totalPnl = totalRealizedPnl || tradePnl;

        if (!trades.length && !totalRealizedPnl) return null;

        // Calculate Trading Duration (Time since first trade)
        const sortedTrades = [...trades].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const firstTrade = sortedTrades[0];

        // Default to 1 day if no trades but we have realized PnL
        let durationDays = 1;

        if (firstTrade) {
            const startTime = new Date(firstTrade.timestamp).getTime();
            const endTime = new Date().getTime();
            const durationMs = endTime - startTime;
            durationDays = Math.max(durationMs / (1000 * 60 * 60 * 24), 1);
        }

        const dailyAvg = totalPnl / durationDays;

        return {
            day: dailyAvg,
            week: dailyAvg * 7,
            month: dailyAvg * 30,
            year: dailyAvg * 365,
            totalPnl,
            days: Math.floor(durationDays)
        };
    }, [trades, totalRealizedPnl]);

    if (isLoading) return <div className="glass-panel p-6 animate-pulse h-40"></div>;
    if (!projections) return null;

    return (
        <div className="glass-panel p-6 rounded-xl border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-text-primary">Income Projections</h3>
                        <p className="text-sm text-text-muted">Estimated based on {projections.days} day(s) active</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ProjectionItem label="Daily" value={projections.day} />
                    <ProjectionItem label="Weekly" value={projections.week} />
                    <ProjectionItem label="Monthly" value={projections.month} />
                    <ProjectionItem label="Yearly" value={projections.year} />
                </div>
            </div>
        </div>
    );
}

function ProjectionItem({ label, value }: { label: string, value: number }) {
    const isPositive = value >= 0;
    return (
        <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm border border-white/5">
            <div className="text-text-muted text-xs uppercase tracking-wider mb-1">{label}</div>
            <div className={`text-xl font-bold font-mono ${isPositive ? 'text-brand-accent' : 'text-red-400'}`}>
                {value < 0 ? '-' : ''}${Math.abs(value).toFixed(2)}
            </div>
        </div>
    );
}
