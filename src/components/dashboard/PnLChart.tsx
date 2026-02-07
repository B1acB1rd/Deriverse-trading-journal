'use client';

import React from 'react';
import { useTradeData } from '@/hooks/useTradeData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatCurrency, cn } from '@/lib/utils';
import { TrendingDown } from 'lucide-react';

export function PnLChart() {
    const { trades } = useTradeData();

    // Prepare Data for Cumulative PnL
    const sortedTrades = [...trades].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let cumulative = 0;
    let peak = 0;

    const data = sortedTrades.map(t => {
        cumulative += (t.pnl || 0); // Handle explicit nulls
        if (cumulative > peak) peak = cumulative;
        const drawdown = cumulative - peak;

        // Precision Fix: Avoid -1.6e-14 noise
        const cleanCumulative = Number(cumulative.toFixed(4));
        const cleanDrawdown = Number(drawdown.toFixed(4));

        return {
            date: new Date(t.timestamp).toLocaleDateString(),
            pnl: cleanCumulative,
            drawdown: cleanDrawdown,
            amt: t.pnl
        };
    });

    const hasData = data.length > 0;
    // Check if essentially flat/zero (e.g. only Spot Buys with 0 PnL)
    const isFlat = data.every(d => Math.abs(d.pnl) < 0.01);

    return (
        <div className="glass-panel p-6 rounded-xl w-full h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-text-primary">Cumulative PnL & Drawdown</h3>
                    <p className="text-xs text-text-muted">Realized performance over time</p>
                </div>
                {/* Tier 2 Insight Callout */}
                <div className="bg-surface/50 border border-primary/20 px-3 py-1.5 rounded-lg">
                    <span className="text-secondary text-xs">Insight: </span>
                    <span className="text-text-primary text-xs font-medium">Drawdown recovers 20% faster in NY Session</span>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[300px] relative">
                {(!hasData || isFlat) ? (
                    <div className="absolute inset-0 flex items-center justify-center text-text-muted flex-col opacity-40 z-10 bg-surface/5">
                        <TrendingDown size={32} className="mb-2" />
                        <p className="text-sm font-medium">No PnL History</p>
                        <p className="text-xs mt-1 text-text-muted">Profits will appear here after your first close.</p>
                    </div>
                ) : null}

                <div className={cn("w-full h-full", (!hasData || isFlat) && "opacity-20 blur-sm pointer-events-none")}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorDD" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-danger)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--color-danger)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="var(--color-text-muted)"
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={30}
                            />
                            <YAxis
                                stroke="var(--color-text-muted)"
                                tick={{ fontSize: 12 }}
                                tickFormatter={(val) => `$${val}`}
                                tickLine={false}
                                axisLine={false}
                                domain={['auto', 'auto']}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--glass-border)', color: 'var(--color-text-primary)' }}
                                itemStyle={{ color: 'var(--color-text-primary)' }}
                                formatter={(value: any) => [formatCurrency(value || 0), '']}
                            />

                            {/* Main PnL Line */}
                            <Area
                                type="monotone"
                                dataKey="pnl"
                                stroke="var(--color-primary)"
                                fillOpacity={1}
                                fill="url(#colorPnL)"
                                strokeWidth={2}
                            />

                            {/* Drawdown Overlay (Negative Values) */}
                            <Area
                                type="monotone"
                                dataKey="drawdown"
                                stroke="transparent"
                                fill="var(--color-danger)"
                                fillOpacity={0.1}
                            />

                            <ReferenceLine y={0} stroke="var(--color-text-secondary)" strokeDasharray="3 3" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
