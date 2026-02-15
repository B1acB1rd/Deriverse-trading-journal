'use client';

import React from 'react';
import { PnLAttributionChart } from '@/components/analytics/PnLAttributionChart';
import { PsychologyChart } from '@/components/analytics/PsychologyChart';
import { OrderTypePerformance } from '@/components/analytics/OrderTypePerformance';
import { DrawdownChart } from '@/components/analytics/DrawdownChart';
import { SymbolBreakdown } from '@/components/analytics/SymbolBreakdown';
import { SessionPerformance } from '@/components/analytics/SessionPerformance';
import { HourlyHeatmap } from '@/components/analytics/HourlyHeatmap';
import { FeeBreakdownChart } from '@/components/analytics/FeeBreakdownChart';
import { DateRangeFilter } from '@/components/common/DateRangeFilter';
import { useTradeData } from '@/hooks/useTradeData';
import {
    calculateProfitFactor,
    calculateExpectancy,
    calculateSharpeRatio,
    calculateSortinoRatio,
    calculateMaxDrawdown,
    detectRevengeTrading,
    detectStreaks,
    calculatePerformanceTrend
} from '@/lib/metrics';
import { exportTradesToCSV } from '@/lib/export';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, AlertTriangle, Activity, Target, BarChart3, Minus, Download } from 'lucide-react';

function MetricCard({ label, value, subtitle, icon: Icon, color = 'text-white' }: {
    label: string; value: string; subtitle?: string; icon: any; color?: string;
}) {
    return (
        <div className="glass-panel p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-solana-purple" />
                <span className="text-xs text-text-muted uppercase tracking-wider">{label}</span>
            </div>
            <div className={`text-xl font-bold font-mono ${color}`}>{value}</div>
            {subtitle && <div className="text-[10px] text-text-muted mt-1">{subtitle}</div>}
        </div>
    );
}

export default function AnalyticsPage() {
    const { trades } = useTradeData();

    const profitFactor = calculateProfitFactor(trades);
    const expectancy = calculateExpectancy(trades);
    const sharpe = calculateSharpeRatio(trades);
    const sortino = calculateSortinoRatio(trades);
    const { maxDrawdown, maxDrawdownPercent } = calculateMaxDrawdown(trades);
    const revengeTrades = detectRevengeTrading(trades);
    const streaks = detectStreaks(trades);
    const trend = calculatePerformanceTrend(trades);

    const formatRatio = (val: number | null): string => {
        if (val === null) return 'N/A';
        if (!isFinite(val)) return '∞';
        return val.toFixed(2);
    };

    const trendColor = trend?.trend === 'Improving' ? 'text-green-400' :
        trend?.trend === 'Declining' ? 'text-red-400' : 'text-yellow-400';

    const TrendIcon = trend?.trend === 'Improving' ? TrendingUp :
        trend?.trend === 'Declining' ? TrendingDown : Minus;

    return (
        <div className="animate-fade-in space-y-6 md:space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-text-primary">Advanced Analytics</h2>
                    <p className="text-sm text-text-muted">Deep dive into your performance drivers.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => exportTradesToCSV(trades)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary bg-white/5 hover:bg-white/10 border border-glass-border rounded-lg transition-colors"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Export CSV
                    </button>
                    <DateRangeFilter />
                </div>
            </div>

            {/* Quant Metrics Grid */}
            <div>
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Quantitative Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <MetricCard
                        label="Profit Factor"
                        value={formatRatio(profitFactor)}
                        subtitle={profitFactor > 1.5 ? 'Strong' : profitFactor > 1 ? 'Positive' : 'Negative'}
                        icon={Target}
                        color={profitFactor > 1 ? 'text-green-400' : 'text-red-400'}
                    />
                    <MetricCard
                        label="Expectancy"
                        value={formatCurrency(expectancy)}
                        subtitle="Per trade avg"
                        icon={BarChart3}
                        color={expectancy >= 0 ? 'text-green-400' : 'text-red-400'}
                    />
                    <MetricCard
                        label="Sharpe Ratio"
                        value={formatRatio(sharpe)}
                        subtitle="Annualized"
                        icon={Activity}
                        color={sharpe !== null && sharpe > 1 ? 'text-green-400' : 'text-yellow-400'}
                    />
                    <MetricCard
                        label="Sortino Ratio"
                        value={formatRatio(sortino)}
                        subtitle="Downside risk"
                        icon={Activity}
                        color={sortino !== null && sortino > 1 ? 'text-green-400' : 'text-yellow-400'}
                    />
                    <MetricCard
                        label="Max Drawdown"
                        value={formatCurrency(maxDrawdown)}
                        subtitle={`${maxDrawdownPercent.toFixed(1)}% from peak`}
                        icon={TrendingDown}
                        color="text-red-400"
                    />
                    <MetricCard
                        label="Trend"
                        value={trend?.trend || 'N/A'}
                        subtitle={trend ? `WR: ${trend.previousWinRate.toFixed(0)}% → ${trend.recentWinRate.toFixed(0)}%` : 'Need 10+ trades'}
                        icon={TrendIcon}
                        color={trendColor}
                    />
                </div>
            </div>

            {/* Behavioral Alerts */}
            {(revengeTrades.length > 0 || streaks.length > 0) && (
                <div>
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Behavioral Alerts</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {revengeTrades.length > 0 && (
                            <div className="glass-panel p-4 rounded-xl border border-red-500/20">
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertTriangle className="w-4 h-4 text-red-400" />
                                    <span className="text-sm font-bold text-red-400">Revenge Trading Detected</span>
                                    <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full ml-auto">
                                        {revengeTrades.length} instance{revengeTrades.length > 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="space-y-2 max-h-[120px] overflow-y-auto">
                                    {revengeTrades.slice(0, 5).map((rt, i) => (
                                        <div key={i} className="flex justify-between items-center text-xs bg-white/5 p-2 rounded">
                                            <span className="text-white/60">{rt.symbol} — {rt.timeBetweenMinutes}m after loss</span>
                                            <span className="text-red-400 font-mono">{formatCurrency(rt.pnl)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {streaks.length > 0 && (
                            <div className="glass-panel p-4 rounded-xl border border-yellow-500/20">
                                <div className="flex items-center gap-2 mb-3">
                                    <Activity className="w-4 h-4 text-yellow-400" />
                                    <span className="text-sm font-bold text-yellow-400">Notable Streaks</span>
                                </div>
                                <div className="space-y-2 max-h-[120px] overflow-y-auto">
                                    {streaks.map((s, i) => (
                                        <div key={i} className="flex justify-between items-center text-xs bg-white/5 p-2 rounded">
                                            <span className={s.type === 'winning' ? 'text-green-400' : 'text-red-400'}>
                                                {s.length} {s.type} streak
                                            </span>
                                            <span className={`font-mono ${s.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {formatCurrency(s.totalPnl)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Per-Symbol Table */}
            <SymbolBreakdown />

            {/* Session & Fee Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <SessionPerformance />
                <FeeBreakdownChart />
            </div>

            {/* Hourly Heatmap */}
            <HourlyHeatmap />

            {/* Existing Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <PnLAttributionChart />
                <PsychologyChart />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <OrderTypePerformance />
                <DrawdownChart />
            </div>
        </div>
    );
}
