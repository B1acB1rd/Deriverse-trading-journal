'use client';

import React from 'react';
import { useTradeData } from '@/hooks/useTradeData';
import { Lock } from 'lucide-react';



export function TradeJournal() {
    const { trades, isLoading, isWalletConnected } = useTradeData();

    if (!isWalletConnected) {
        return (
            <div className="glass-panel p-8 rounded-xl flex flex-col items-center justify-center min-h-[200px] text-center">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <Lock className="text-xl text-text-muted" size={24} />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">Trade History Locked</h3>
                <p className="text-text-muted max-w-sm">
                    Connect your Solana wallet to automatically synchronize and analyze your Deriverse trading history.
                </p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="glass-panel p-6 rounded-xl animate-pulse">
                <div className="h-8 bg-white/5 rounded mb-4 w-1/3"></div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-12 bg-white/5 rounded"></div>)}
                </div>
            </div>
        );
    }

    return (
        <div className="glass-panel rounded-xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-lg font-bold text-text-primary">Recent Trades</h3>
                <a href="/journal" className="text-xs text-brand-accent hover:text-brand-accent/80 transition-colors">
                    View Full Journal &rarr;
                </a>
            </div>

            <div className="overflow-x-auto">
                {trades.length === 0 ? (
                    <div className="p-8 text-center text-text-muted">No trade history found.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-text-muted border-b border-white/5">
                                <th className="p-4 font-medium">Date</th>
                                <th className="p-4 font-medium">Symbol</th>
                                <th className="p-4 font-medium">Side</th>
                                <th className="p-4 font-medium">Size</th>
                                <th className="p-4 font-medium">Price</th>
                                <th className="p-4 font-medium">PnL</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {trades.slice(0, 5).map((trade) => {
                                const isProfit = (trade.pnl || 0) >= 0;
                                const isLong = trade.side === 'LONG';

                                return (
                                    <tr key={trade.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4 font-mono text-xs text-text-muted">
                                            <div className="text-text-primary">
                                                {new Date(trade.timestamp).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}
                                            </div>
                                            <div>
                                                {new Date(trade.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            <div className="font-bold text-text-primary">{trade.symbol}</div>
                                        </td>

                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${isLong ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                                }`}>
                                                {trade.side}
                                            </span>
                                        </td>

                                        <td className="p-4 font-mono">
                                            {trade.size ? trade.size.toFixed(4) : '0.00'}
                                        </td>

                                        <td className="p-4 font-mono text-text-muted">
                                            ${trade.price ? trade.price.toFixed(2) : '-'}
                                        </td>

                                        <td className="p-4">
                                            <div className={`font-mono font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                                                {isProfit ? '+' : ''}${(trade.pnl || 0).toFixed(4)}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

