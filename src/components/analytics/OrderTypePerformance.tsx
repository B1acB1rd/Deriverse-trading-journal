'use client';

import React from 'react';
import { useTradeData } from '@/hooks/useTradeData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { Info } from 'lucide-react';

export function OrderTypePerformance() {
    const { trades } = useTradeData();

    const data = React.useMemo(() => {
        if (!trades || trades.length === 0) return [];

        const marketOrders = trades.filter(t => t.orderType === 'MARKET');
        const limitOrders = trades.filter(t => t.orderType === 'LIMIT');

        const marketPnl = marketOrders.reduce((acc, t) => acc + t.pnl, 0);
        const limitPnl = limitOrders.reduce((acc, t) => acc + t.pnl, 0);

        const marketFees = marketOrders.reduce((acc, t) => acc + (t.fees || 0), 0);
        const limitFees = limitOrders.reduce((acc, t) => acc + (t.fees || 0), 0);

        const marketWins = marketOrders.filter(t => t.pnl > 0).length;
        const limitWins = limitOrders.filter(t => t.pnl > 0).length;

        const marketWinRate = marketOrders.length > 0 ? (marketWins / marketOrders.length) * 100 : 0;
        const limitWinRate = limitOrders.length > 0 ? (limitWins / limitOrders.length) * 100 : 0;

        return [
            {
                name: 'Market',
                PnL: marketPnl,
                Fees: -marketFees, // Display fees as negative
                WinRate: marketWinRate,
                Count: marketOrders.length
            },
            {
                name: 'Limit',
                PnL: limitPnl,
                Fees: -limitFees,
                WinRate: limitWinRate,
                Count: limitOrders.length
            }
        ];
    }, [trades]);

    return (
        <div className="glass-panel p-6 rounded-xl h-[400px] flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-bold text-text-primary">Order Type Analysis</h3>
                    <p className="text-xs text-text-muted">Market vs Limit Order Performance</p>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--color-text-muted)" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis stroke="var(--color-text-muted)" tickFormatter={(val) => `$${val}`} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--glass-border)', borderRadius: '8px' }}
                            itemStyle={{ fontSize: '12px' }}
                            formatter={(value: any) => formatCurrency(Number(value) || 0)}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Bar dataKey="PnL" name="Net PnL" fill="#8884d8" radius={[4, 4, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.PnL >= 0 ? 'var(--color-success)' : 'var(--color-danger)'} />
                            ))}
                        </Bar>
                        <Bar dataKey="Fees" name="Fees Paid" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-3 border-t border-glass-border grid grid-cols-2 gap-4 text-xs">
                <div className="flex justify-between">
                    <span className="text-text-muted">Market Win Rate:</span>
                    <span className="text-white font-mono">{data[0]?.WinRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-text-muted">Limit Win Rate:</span>
                    <span className="text-white font-mono">{data[1]?.WinRate.toFixed(1)}%</span>
                </div>
            </div>
        </div>
    );
}
