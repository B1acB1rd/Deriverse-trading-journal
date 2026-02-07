'use client';

import React, { useState } from 'react';
import { useTradeData } from '@/hooks/useTradeData';
import { formatCurrency, cn } from '@/lib/utils';
import { Play, RotateCcw, GitCommit } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export function TradeReplaySimulator() {
    const { trades } = useTradeData();
    const [priceAdjustment, setPriceAdjustment] = useState(0); // in %
    const [simulatedPnL, setSimulatedPnL] = useState(0);

    const runSimulation = () => {
        // Simple simulation: Adjust entry prices by X% and recalculate PnL
        // Only applicable to Longs and Shorts
        let newPnL = 0;
        trades.forEach(trade => {
            if (trade.side === 'LONG') {
                // If price moves up (adj > 0), PnL increases
                // Simplified logic: PnL impact = Size * (Adjustment / 100)
                newPnL += trade.pnl + (trade.size * (priceAdjustment / 100));
            } else if (trade.side === 'SHORT') {
                // If price moves up (adj > 0), PnL decreases
                newPnL += trade.pnl - (trade.size * (priceAdjustment / 100));
            }
        });
        setSimulatedPnL(newPnL);
    };

    const resetSimulation = () => {
        setPriceAdjustment(0);
        setSimulatedPnL(trades.reduce((sum, t) => sum + t.pnl, 0));
    };

    const currentPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
    const diff = simulatedPnL - currentPnL;

    return (
        <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <GitCommit size={80} />
            </div>

            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Play className="text-accent" size={20} />
                Trade Replay / Simulator
            </h3>

            <div className="flex flex-col gap-6">
                <div>
                    <label className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-2 block">
                        Price Deviation (Global)
                    </label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min="-10"
                            max="10"
                            step="0.5"
                            value={priceAdjustment}
                            onChange={(e) => setPriceAdjustment(parseFloat(e.target.value))}
                            className="w-full accent-accent h-2 bg-surface-hover rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="w-16 text-right font-mono font-bold text-accent">
                            {priceAdjustment > 0 ? '+' : ''}{priceAdjustment}%
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-surface/50 border border-border">
                        <div className="text-xs text-text-muted mb-1">Actual PnL</div>
                        <div className={cn("text-xl font-bold", currentPnL >= 0 ? "text-success" : "text-danger")}>
                            {formatCurrency(currentPnL)}
                        </div>
                    </div>
                    <div className="p-4 rounded-lg bg-surface/50 border border-accent/30 relative overflow-hidden">
                        <div className="absolute inset-0 bg-accent/5 z-0"></div>
                        <div className="text-xs text-text-muted mb-1 relative z-10">Simulated PnL</div>
                        <div className={cn("text-xl font-bold relative z-10", simulatedPnL >= 0 ? "text-success" : "text-danger")}>
                            {simulatedPnL === 0 && priceAdjustment === 0 ? "---" : formatCurrency(simulatedPnL)}
                        </div>
                        {priceAdjustment !== 0 && (
                            <div className={cn("text-xs font-mono mt-1 relative z-10", diff >= 0 ? "text-success" : "text-danger")}>
                                ({diff >= 0 ? '+' : ''}{formatCurrency(diff)})
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={runSimulation}
                        className="flex-1 py-2 bg-accent text-white rounded-lg font-bold hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
                    >
                        <Play size={16} fill="currentColor" /> Run logic
                    </button>
                    <button
                        onClick={resetSimulation}
                        className="px-4 py-2 bg-surface-hover text-text-secondary rounded-lg hover:text-text-primary transition-colors"
                    >
                        <RotateCcw size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
