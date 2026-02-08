'use client';

import React from 'react';
import { useTradeData } from '@/hooks/useTradeData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency, cn } from '@/lib/utils';
import { Info } from 'lucide-react';

export function PnLAttributionChart() {
    const { trades } = useTradeData();

    // Aggregate data dynamically from trades
    const data = React.useMemo(() => {
        if (!trades || trades.length === 0) return [];

        const dailyMap = new Map<string, { day: string, Gross: number, Fees: number, Slippage: number, Net: number }>();

        trades.forEach(t => {
            const date = new Date(t.timestamp);
            const dayKey = date.toLocaleDateString('en-US', { weekday: 'short' });

            if (!dailyMap.has(dayKey)) {
                dailyMap.set(dayKey, { day: dayKey, Gross: 0, Fees: 0, Slippage: 0, Net: 0 });
            }

            const entry = dailyMap.get(dayKey)!;
            // Assuming pnl is Net PnL. Reversing logic: Net = Gross - Fees - Slippage
            // So Gross = Net + Fees + Slippage
            const fees = t.fees || 0;
            const slippage = t.slippage || 0;
            const net = t.pnl;
            const gross = net + fees + slippage; // Simplified approximation

            entry.Gross += gross;
            entry.Fees -= fees; // Fees are negative impact
            entry.Slippage -= slippage; // Slippage is negative impact
            entry.Net += net;
        });

        // Return array sorted by day (mock sort order Mon-Fri or just return values)
        return Array.from(dailyMap.values()).slice(0, 5);
    }, [trades]);

    if (!trades || trades.length === 0) {
        return (
            <div className="glass-panel p-6 rounded-xl h-[400px] flex flex-col items-center justify-center text-text-muted">
                <p>No trade history available for attribution.</p>
            </div>
        );
    }

    return (
        <div className="glass-panel p-6 rounded-xl h-[400px] flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-bold text-text-primary">PnL Attribution</h3>
                    <p className="text-xs text-text-muted">Breakdown of performance impact factors</p>
                </div>
                <div className="group relative">
                    <Info size={16} className="text-text-muted cursor-help" />
                    <div className="absolute right-0 w-64 p-3 bg-surface border border-glass-border rounded-lg text-xs text-text-secondary hidden group-hover:block z-50 shadow-xl">
                        Shows how Fees and Slippage eat into your Gross PnL. Keep slippage below 10% of fees for optimal execution.
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} stackOffset="sign">
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                        <XAxis dataKey="day" stroke="var(--color-text-muted)" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis stroke="var(--color-text-muted)" tickFormatter={(val) => `$${val}`} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--glass-border)', borderRadius: '8px' }}
                            itemStyle={{ fontSize: '12px' }}
                            formatter={(value: number | undefined) => formatCurrency(value || 0)}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

                        <Bar dataKey="Gross" name="Gross PnL" fill="var(--color-success)" stackId="stack" barSize={32} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Fees" name="Fees Paid" fill="var(--color-primary)" stackId="stack" />
                        <Bar dataKey="Slippage" name="Slippage Cost" fill="var(--color-danger)" stackId="stack" radius={[0, 0, 4, 4]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Calculate total slippage from real trade data */}
            {(() => {
                const totalSlippage = data.reduce((sum, d) => sum + Math.abs(d.Slippage), 0);
                const totalNet = data.reduce((sum, d) => sum + d.Net, 0);
                const slippagePercent = totalNet !== 0 ? Math.abs((totalSlippage / Math.abs(totalNet)) * 100) : 0;
                return (
                    <div className="mt-4 pt-3 border-t border-glass-border flex justify-between items-center text-xs">
                        <span className="text-text-muted">Total Slippage Impact:</span>
                        <span className="text-danger font-bold">
                            - ${totalSlippage.toFixed(2)} ({slippagePercent.toFixed(1)}% of Net PnL)
                        </span>
                    </div>
                );
            })()}
        </div>
    );
}
