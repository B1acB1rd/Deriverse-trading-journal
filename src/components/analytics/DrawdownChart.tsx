'use client';

import React from 'react';
import { useTradeData } from '@/hooks/useTradeData';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/lib/utils';

export function DrawdownChart() {
    const { trades } = useTradeData();

    const data = React.useMemo(() => {
        if (!trades || trades.length === 0) return [];

        // Sort chronologically
        const sortedTrades = [...trades].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        let runningPnl = 0;
        let peakPnl = 0;

        return sortedTrades.map((t, i) => {
            const pnl = t.pnl || 0;
            runningPnl += pnl;

            if (runningPnl > peakPnl) {
                peakPnl = runningPnl;
            }

            const drawdown = runningPnl - peakPnl;
            const drawdownPct = peakPnl !== 0 ? (drawdown / Math.abs(peakPnl)) * 100 : 0; // Avoid division by zero

            return {
                index: i + 1,
                date: new Date(t.timestamp).toLocaleDateString(),
                Equity: runningPnl,
                Drawdown: drawdown, // Absolute drawdown in $
                DrawdownPct: drawdownPct
            };
        });
    }, [trades]);

    if (!trades || trades.length === 0) return null;

    // Calculate Max Drawdown
    const maxDrawdown = Math.min(...data.map(d => d.Drawdown));
    const maxDrawdownPct = Math.min(...data.map(d => d.DrawdownPct));

    return (
        <div className="glass-panel p-6 rounded-xl h-[400px] flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-bold text-text-primary">Equity & Drawdown</h3>
                    <p className="text-xs text-text-muted">Historical performance and risk</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-text-muted">Max Drawdown</p>
                    <p className="text-lg font-mono font-bold text-danger">{formatCurrency(maxDrawdown)}</p>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-danger)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--color-danger)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                        <XAxis dataKey="index" stroke="var(--color-text-muted)" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" stroke="var(--color-text-muted)" tickFormatter={(val) => `$${val}`} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip
                            cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                            contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--glass-border)', borderRadius: '8px' }}
                            itemStyle={{ fontSize: '12px' }}
                            formatter={(value: any) => formatCurrency(Number(value) || 0)}
                        />
                        <Area type="monotone" dataKey="Equity" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorEquity)" yAxisId="left" />
                        {/* Optionally overlay Drawdown on a second axis or separate chart. For now single chart is cleaner. */}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
