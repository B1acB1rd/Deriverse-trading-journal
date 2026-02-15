'use client';

import React from 'react';
import { useTradeData } from '@/hooks/useTradeData';
import { calculateSymbolMetrics } from '@/lib/metrics';
import { formatCurrency } from '@/lib/utils';

export function SymbolBreakdown() {
    const { trades } = useTradeData();

    const symbolMetrics = React.useMemo(() => {
        if (!trades || trades.length === 0) return [];
        return calculateSymbolMetrics(trades);
    }, [trades]);

    if (symbolMetrics.length === 0) {
        return (
            <div className="glass-panel p-6 rounded-xl">
                <h3 className="text-lg font-bold text-text-primary mb-2">Per-Symbol Performance</h3>
                <p className="text-xs text-text-muted">No trade data available</p>
            </div>
        );
    }

    return (
        <div className="glass-panel p-6 rounded-xl">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-text-primary">Per-Symbol Performance</h3>
                <p className="text-xs text-text-muted">PnL, volume, and win rate per instrument</p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-glass-border">
                            <th className="text-left text-text-muted py-2 pr-3 uppercase tracking-wider">Symbol</th>
                            <th className="text-right text-text-muted py-2 px-3 uppercase tracking-wider">PnL</th>
                            <th className="text-right text-text-muted py-2 px-3 uppercase tracking-wider">Volume</th>
                            <th className="text-right text-text-muted py-2 px-3 uppercase tracking-wider">Trades</th>
                            <th className="text-right text-text-muted py-2 px-3 uppercase tracking-wider">Win Rate</th>
                            <th className="text-right text-text-muted py-2 pl-3 uppercase tracking-wider">Fees</th>
                        </tr>
                    </thead>
                    <tbody>
                        {symbolMetrics.map((s) => (
                            <tr key={s.symbol} className="border-b border-glass-border/30 hover:bg-white/5 transition-colors">
                                <td className="py-2.5 pr-3 font-medium text-white">{s.symbol}</td>
                                <td className={`py-2.5 px-3 text-right font-mono ${s.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {s.pnl >= 0 ? '+' : ''}{formatCurrency(s.pnl)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-text-secondary">
                                    {formatCurrency(s.volume)}
                                </td>
                                <td className="py-2.5 px-3 text-right text-text-secondary">{s.tradeCount}</td>
                                <td className={`py-2.5 px-3 text-right font-mono ${s.winRate >= 50 ? 'text-green-400' : 'text-yellow-400'}`}>
                                    {s.winRate.toFixed(1)}%
                                </td>
                                <td className="py-2.5 pl-3 text-right font-mono text-text-muted">
                                    {formatCurrency(s.fees)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
