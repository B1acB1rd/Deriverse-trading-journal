'use client';

import React from 'react';
import { useTradeData } from '@/hooks/useTradeData';
import { formatCurrency, formatPercentage, cn } from '@/lib/utils';
import { calculatePnLAttribution } from '@/lib/metrics';
import { TrendingUp, TrendingDown, DollarSign, Activity, Zap, Timer, Scale, Trophy } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface KpiCardProps {
    title: string;
    value: string;
    change?: string;
    isPositive?: boolean;
    icon: React.ElementType;
    chartData?: any[];
    highlight?: boolean;
}

function KpiCard({ title, value, change, isPositive, icon: Icon, chartData, highlight }: KpiCardProps) {
    return (
        <div className={cn('glass-panel rounded-xl p-5 relative overflow-hidden', highlight && 'border-primary/30 shadow-[0_0_20px_rgba(124,58,237,0.15)]')}>
            {highlight && <div className="absolute top-0 right-0 p-1 bg-primary/20 rounded-bl-lg text-[10px] text-primary font-bold uppercase tracking-wider">Deriverse Native</div>}

            <div className="flex justify-between items-start mb-2">
                <div className="p-2 rounded-lg bg-surface-hover/50">
                    <Icon className={cn("w-5 h-5", highlight ? "text-primary" : "text-text-secondary")} />
                </div>
                {change && (
                    <div className={cn("flex items-center text-xs font-medium px-2 py-1 rounded-full", isPositive ? "text-success bg-success/10" : "text-danger bg-danger/10")}>
                        {isPositive ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                        {change}
                    </div>
                )}
            </div>

            <div className="mt-2">
                <h3 className="text-sm text-text-muted font-medium uppercase tracking-wide">{title}</h3>
                <p className="text-2xl font-bold text-text-primary mt-1 shadow-sm">{value}</p>
            </div>

            {chartData && (
                <div className="h-10 mt-3 -mx-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <Area
                                type="monotone"
                                dataKey="val"
                                stroke={isPositive ? "var(--color-success)" : "var(--color-danger)"}
                                fill={isPositive ? "var(--color-success)" : "var(--color-danger)"}
                                fillOpacity={0.1}
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

export function KpiGrid() {
    const { trades, isLoading, totalRealizedPnl } = useTradeData();

    if (isLoading) return <div className="text-text-muted animate-pulse">Loading Metrics...</div>;

    // Calculate Metrics - use realized PnL from perp stats if trades don't have PnL
    const tradePnL = trades.reduce((acc, t) => acc + t.pnl, 0);
    const totalPnL = totalRealizedPnl || tradePnL;
    const winRate = trades.length > 0 ? trades.filter(t => t.pnl > 0).length / trades.length : 0;
    const count = trades.length;

    const longCount = trades.filter(t => t.side === 'LONG').length;
    const shortCount = trades.filter(t => t.side === 'SHORT').length;
    const longShortRatio = shortCount > 0 ? (longCount / shortCount).toFixed(2) : 'Inf';

    const avgDurationSeconds = trades.length > 0 ? trades.reduce((acc, t) => acc + (t.duration || 0), 0) / trades.length : 0;
    const avgDurationFormatted = `${Math.floor(avgDurationSeconds / 60)}m ${Math.floor(avgDurationSeconds % 60)}s`;

    const largestWin = trades.length > 0 ? Math.max(...trades.map(t => t.pnl)) : 0;
    const largestLoss = trades.length > 0 ? Math.min(...trades.map(t => t.pnl)) : 0;

    const attribution = calculatePnLAttribution(trades);



    // Recent PnL Trend (Sparkline) - Last 20 trades reversed (oldest to newest)
    const recentTrades = [...trades].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).slice(-20);
    const sparkData = recentTrades.map(t => ({ val: t.pnl }));

    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
            <KpiCard
                title="Total PnL"
                value={formatCurrency(totalPnL)}
                isPositive={totalPnL > 0}
                icon={DollarSign}
                chartData={sparkData}
            />
            <KpiCard
                title="Win Rate"
                value={formatPercentage(winRate)}
                change={`${trades.length} Trades`}
                isPositive={winRate > 0.5}
                icon={Activity}
            />
            <KpiCard
                title="Long/Short Bias"
                value={longShortRatio}
                change={`${longCount}L / ${shortCount}S`}
                isPositive={longCount > shortCount}
                icon={Scale}
            />
            <KpiCard
                title="Net PnL (Fees)"
                value={formatCurrency(attribution.netPnL)}
                change={`${formatCurrency(attribution.grossPnL)} gross`}
                isPositive={attribution.netPnL > 0}
                icon={TrendingUp}
            />
            {/* Removed Gas Savings Card as it was based on estimation, causing confusion. */}
        </div>
    );
}
