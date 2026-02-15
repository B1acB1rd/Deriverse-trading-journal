'use client';

import React from 'react';
import { useTradeData } from '@/hooks/useTradeData';
import { calculateHourlyMetrics } from '@/lib/metrics';
import { formatCurrency } from '@/lib/utils';

export function HourlyHeatmap() {
    const { trades } = useTradeData();

    const hourlyData = React.useMemo(() => {
        if (!trades || trades.length === 0) return [];
        return calculateHourlyMetrics(trades);
    }, [trades]);

    if (hourlyData.length === 0 || hourlyData.every(h => h.tradeCount === 0)) {
        return (
            <div className="glass-panel p-6 rounded-xl">
                <h3 className="text-lg font-bold text-text-primary mb-2">Hourly Performance</h3>
                <p className="text-xs text-text-muted">No trade data available</p>
            </div>
        );
    }

    const maxPnl = Math.max(...hourlyData.map(h => Math.abs(h.pnl)), 0.01);
    const activeHours = hourlyData.filter(h => h.tradeCount > 0);

    return (
        <div className="glass-panel p-6 rounded-xl">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-text-primary">Hourly Performance</h3>
                <p className="text-xs text-text-muted">PnL by hour of day (UTC). Active hours: {activeHours.length}/24</p>
            </div>

            <div className="grid grid-cols-12 gap-1">
                {hourlyData.map((h) => {
                    const intensity = h.tradeCount > 0 ? Math.min(Math.abs(h.pnl) / maxPnl, 1) : 0;
                    const opacity = h.tradeCount > 0 ? 0.2 + (intensity * 0.8) : 0.05;
                    const bgColor = h.tradeCount === 0
                        ? 'rgba(255,255,255,0.05)'
                        : h.pnl >= 0
                            ? `rgba(34, 197, 94, ${opacity})`
                            : `rgba(239, 68, 68, ${opacity})`;

                    return (
                        <div
                            key={h.hour}
                            className="relative group cursor-default"
                            title={`${h.hour}:00 UTC — ${h.tradeCount} trades, ${formatCurrency(h.pnl)} PnL, ${h.winRate.toFixed(0)}% WR`}
                        >
                            <div
                                className="aspect-square rounded-sm flex items-center justify-center text-[9px] font-mono text-white/60 transition-all hover:ring-1 hover:ring-white/30"
                                style={{ backgroundColor: bgColor }}
                            >
                                {h.hour}
                            </div>
                            {h.tradeCount > 0 && (
                                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-10 bg-surface-dark border border-glass-border rounded-lg p-2 text-[10px] whitespace-nowrap shadow-xl">
                                    <div className="text-white font-bold">{h.hour}:00 UTC</div>
                                    <div className={h.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>PnL: {formatCurrency(h.pnl)}</div>
                                    <div className="text-text-muted">{h.tradeCount} trades · {h.winRate.toFixed(0)}% WR</div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-glass-border flex items-center justify-between text-[10px] text-text-muted">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.6)' }}></div>
                    <span>Loss</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}></div>
                    <span>No trades</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(34, 197, 94, 0.6)' }}></div>
                    <span>Profit</span>
                </div>
            </div>
        </div>
    );
}
