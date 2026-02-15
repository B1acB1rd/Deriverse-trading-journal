'use client';

import React from 'react';
import { useTradeData } from '@/hooks/useTradeData';
import { calculateFeeBreakdown } from '@/lib/metrics';
import { formatCurrency } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b'];

export function FeeBreakdownChart() {
    const { trades } = useTradeData();

    const feeData = React.useMemo(() => {
        if (!trades || trades.length === 0) return null;
        return calculateFeeBreakdown(trades);
    }, [trades]);

    if (!feeData || feeData.totalFees === 0) {
        return (
            <div className="glass-panel p-6 rounded-xl h-[400px]">
                <h3 className="text-lg font-bold text-text-primary mb-2">Fee Breakdown</h3>
                <p className="text-xs text-text-muted">No fee data available</p>
            </div>
        );
    }

    const chartData = [
        { name: 'Taker Fees', value: Math.abs(feeData.takerFees), color: COLORS[0] },
        { name: 'Maker Rebates', value: Math.abs(feeData.makerFees), color: COLORS[1] },
        { name: 'Funding Fees', value: Math.abs(feeData.fundingFees), color: COLORS[2] },
    ].filter(d => d.value > 0);

    return (
        <div className="glass-panel p-6 rounded-xl h-[400px] flex flex-col">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-text-primary">Fee Breakdown</h3>
                <p className="text-xs text-text-muted">Where your fees are going</p>
            </div>

            <div className="flex-1 flex items-center">
                <div className="w-1/2 h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={3}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--glass-border)', borderRadius: '8px' }}
                                formatter={(value: any) => formatCurrency(Number(value) || 0)}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="w-1/2 space-y-3">
                    {chartData.map((d) => (
                        <div key={d.name} className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-text-muted">{d.name}</div>
                                <div className="text-sm font-mono text-white">{formatCurrency(d.value)}</div>
                            </div>
                        </div>
                    ))}
                    <div className="pt-2 border-t border-glass-border">
                        <div className="text-xs text-text-muted">Total Fees</div>
                        <div className="text-sm font-mono font-bold text-white">{formatCurrency(Math.abs(feeData.totalFees))}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
