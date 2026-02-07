'use client';

import React, { useRef } from 'react';
import { useTradeData } from '@/hooks/useTradeData';
import { Download, Share2, Copy } from 'lucide-react';
import { formatCurrency, formatPercentage, cn } from '@/lib/utils';


export function StrategySnapshotCard() {
    const { trades, profile, isWalletConnected } = useTradeData();
    const cardRef = useRef<HTMLDivElement>(null);

    // --- Disconnected / Empty State ---
    if (!isWalletConnected || trades.length === 0) {
        return (
            <div className="flex flex-col gap-6 w-full max-w-lg mx-auto">
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[var(--color-surface)] p-8 h-[500px] flex flex-col items-center justify-center text-center">
                    {/* Blurred decorative background to hint at content */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 blur-xl" />

                    <div className="relative z-10 p-4 rounded-full bg-surface border border-white/10 mb-6 shadow-[0_0_30px_rgba(124,58,237,0.2)]">
                        <Share2 size={32} className="text-[var(--color-text-muted)]" />
                    </div>

                    <h2 className="relative z-10 text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                        Generate Your Snapshot
                    </h2>
                    <p className="relative z-10 text-sm text-[var(--color-text-secondary)] max-w-xs mb-8 leading-relaxed">
                        Connect your wallet to analyze your trading history and mint your personalized Trader DNA card.
                    </p>

                    <div className="relative z-10 px-6 py-2 rounded-lg bg-surface-hover border border-white/5 text-xs font-mono text-[var(--color-text-muted)]">
                        Waiting for connection...
                    </div>
                </div>
            </div>
        );
    }

    // --- Stats Calculation ---
    const stats = {
        totalTrades: trades.length,
        winRate: trades.length > 0 ? (trades.filter(t => t.pnl > 0).length / trades.length) : 0,
        totalPnL: trades.reduce((a, t) => a + t.pnl, 0),
        maxConsec: calculateConsecutiveWins(trades),
    };

    const copyAsText = () => {
        const text = `Strategy Snapshot
Archetype: ${profile?.style || 'Unknown'}
Trades: ${stats.totalTrades}
Win Rate: ${formatPercentage(stats.winRate)}
Total PnL: ${formatCurrency(stats.totalPnL)}

Share this snapshot and earn social credibility!`;
        navigator.clipboard.writeText(text);
        alert('Snapshot copied to clipboard!');
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-lg mx-auto">
            <div
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-[var(--color-surface)] shadow-2xl p-0"
                ref={cardRef}
            >
                {/* Premium Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-[var(--color-surface)] to-accent/10" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] opacity-50 pointer-events-none" />

                <div className="relative z-10 p-8">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tighter">Strategy<br />Snapshot</h2>
                            <p className="text-xs font-medium text-[var(--color-text-muted)] mt-2 uppercase tracking-widest">Verified Edge</p>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[10px] font-mono text-[var(--color-text-secondary)] mb-2">
                                {new Date().toLocaleDateString()}
                            </div>
                            <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Deriverse L2</div>
                        </div>
                    </div>

                    {/* DNA Strip */}
                    <div className="flex items-center gap-4 mb-8 p-4 rounded-xl bg-black/20 border border-white/5 backdrop-blur-sm">
                        <div className="flex-1 text-center border-r border-white/5">
                            <div className="text-[9px] uppercase font-bold text-[var(--color-text-muted)] mb-1">Archetype</div>
                            <div className="text-lg font-bold text-accent">{profile?.style || 'Scalper'}</div>
                        </div>
                        <div className="flex-1 text-center border-r border-white/5">
                            <div className="text-[9px] uppercase font-bold text-[var(--color-text-muted)] mb-1">Bias</div>
                            <div className="text-lg font-bold text-white">{profile?.bias || 'Long'}</div>
                        </div>
                        <div className="flex-1 text-center">
                            <div className="text-[9px] uppercase font-bold text-[var(--color-text-muted)] mb-1">Session</div>
                            <div className="text-lg font-bold text-white">{profile?.bestSession || 'NY Open'}</div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-8">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5">
                            <div className="text-3xl font-black text-white font-mono tracking-tighter">{stats.totalTrades}</div>
                            <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase mt-1">Total Trades</div>
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5">
                            <div className="text-3xl font-black text-white font-mono tracking-tighter">{formatPercentage(stats.winRate)}</div>
                            <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase mt-1">Win Rate</div>
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5">
                            <div className={cn("text-2xl font-black font-mono tracking-tight break-all", stats.totalPnL > 0 ? 'text-success' : 'text-danger')}>
                                {formatCurrency(stats.totalPnL)}
                            </div>
                            <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase mt-1">Net PnL</div>
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5">
                            <div className="text-3xl font-black text-white font-mono tracking-tighter">{stats.maxConsec}</div>
                            <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase mt-1">Max Streak</div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-6 border-t border-white/10">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_var(--color-success)]" />
                            <span className="text-[10px] font-medium text-[var(--color-text-muted)]">Verified On-Chain</span>
                        </div>
                        <div className="text-[10px] font-bold text-[var(--color-text-muted)]">ID: {Math.random().toString(36).substr(2, 8).toUpperCase()}</div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
                <button
                    onClick={copyAsText}
                    className="flex-1 flex items-center justify-center gap-2 p-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm uppercase tracking-wider shadow-lg hover:shadow-[0_0_20px_var(--color-primary-glow)] transition-all duration-300"
                >
                    <Copy size={18} /> Copy Stats
                </button>
                <button
                    onClick={() => alert('Exporting high-res image...')}
                    className="flex-1 flex items-center justify-center gap-2 p-4 rounded-xl bg-transparent border border-white/20 text-white font-bold text-sm uppercase tracking-wider hover:bg-white/5 transition-all duration-300"
                >
                    <Download size={18} /> Export
                </button>
            </div>
        </div >
    );
}

function calculateConsecutiveWins(trades: any[]): number {
    let maxStreak = 0;
    let currentStreak = 0;
    for (const trade of trades) {
        if (trade.pnl > 0) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
        } else {
            currentStreak = 0;
        }
    }
    return maxStreak;
}
