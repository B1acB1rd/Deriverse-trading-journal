'use client';

import React, { useState } from 'react';
import { Trade } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Zap, RotateCcw } from 'lucide-react';
import s from './TradeReplay.module.css';

interface TradeReplayProps {
    trade: Trade;
}

export function TradeReplay({ trade }: TradeReplayProps) {
    const [limitPrice, setLimitPrice] = useState<number>(trade.price);
    const [isSimulating, setIsSimulating] = useState(false);

    const simulateLimitOrder = () => {
        setIsSimulating(true);
        // Calculate what-if PnL if filled at limit price
        const limitDiff = Math.abs(limitPrice - trade.price);
        const improvement = trade.side === 'LONG' 
            ? (trade.price - limitPrice) * trade.size
            : (limitPrice - trade.price) * trade.size;
        
        setTimeout(() => {
            alert(`What-if Analysis:\n\nIf filled at $${limitPrice.toFixed(2)}:\n\nImprovement vs Actual: ${formatCurrency(improvement)}\nNew PnL: ${formatCurrency(trade.pnl + improvement)}`);
            setIsSimulating(false);
        }, 600);
    };

    const resetLimitPrice = () => {
        setLimitPrice(trade.price);
    };

    return (
        <div className={s.container}>
            <h4 className={s.title}>
                <Zap size={14} /> Trade Replay: What-If Simulator
            </h4>
            <p className={s.description}>
                Adjust the fill price to see how different execution would have affected your PnL.
            </p>

            <div className={s.inputGroup}>
                <label className={s.label}>
                    Hypothetical Fill Price
                    <span className={s.hint}>(Actual: ${trade.price.toFixed(2)})</span>
                </label>
                <input
                    type="number"
                    step="0.01"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(parseFloat(e.target.value) || trade.price)}
                    className={s.input}
                />
            </div>

            <div className={s.preview}>
                <div className={s.previewRow}>
                    <span className={s.previewLabel}>Actual Execution Price</span>
                    <span className={s.previewValue}>${trade.price.toFixed(2)}</span>
                </div>
                <div className={s.previewRow}>
                    <span className={s.previewLabel}>Simulated Fill Price</span>
                    <span className={cn(s.previewValue, limitPrice > trade.price ? s.positive : limitPrice < trade.price ? s.negative : '')}>
                        ${limitPrice.toFixed(2)}
                    </span>
                </div>
                <div className={s.previewRow} style={{ borderTop: '1px solid rgba(124, 58, 237, 0.2)', paddingTop: '1rem', marginTop: '1rem' }}>
                    <span className={s.previewLabel}>Price Difference</span>
                    <span className={cn(s.previewValue, Math.abs(limitPrice - trade.price) > 0 ? s.positive : '')}>
                        {limitPrice > trade.price ? '+' : ''}{(limitPrice - trade.price).toFixed(2)}
                    </span>
                </div>
            </div>

            <div className={s.actions}>
                <button 
                    className={s.resetBtn} 
                    onClick={resetLimitPrice}
                    disabled={limitPrice === trade.price}
                >
                    <RotateCcw size={12} /> Reset
                </button>
                <button 
                    className={cn(s.simulateBtn, isSimulating && s.simulating)}
                    onClick={simulateLimitOrder}
                    disabled={isSimulating}
                >
                    {isSimulating ? 'Simulating...' : 'Run Simulation'}
                </button>
            </div>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
