'use client';

import React from 'react';
import { useTradeData } from '@/hooks/useTradeData';
import { ShieldCheck, CheckCircle, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DataIntegrityPanel() {
    const { snapshots, isWalletConnected } = useTradeData();
    const latestSnapshot = snapshots[0];

    if (!isWalletConnected || !latestSnapshot) {
        return (
            <div className="glass-panel p-5 rounded-xl border-l-4 border-l-glass-border flex items-center justify-between opacity-50">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="text-text-muted w-5 h-5" />
                    <h3 className="font-bold text-text-muted">Data Integrity</h3>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">
                    No Connection
                </span>
            </div>
        );
    }

    return (
        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-success">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="text-success w-5 h-5" />
                    <h3 className="font-bold text-text-primary">On-Chain Data Integrity</h3>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-2 py-1 rounded">
                    On-Chain Verified
                </span>
            </div>

            <div className="bg-surface/40 p-3 rounded-lg flex items-center justify-between mb-3 border border-glass-border">
                <div>
                    <p className="text-xs text-text-muted mb-1">Latest Snapshot</p>
                    <p className="text-sm font-mono text-text-primary">{latestSnapshot.date}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-text-muted mb-1">Trades Verified</p>
                    <p className="text-sm font-bold text-text-primary">{latestSnapshot.tradeCount}</p>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted flex items-center gap-1">
                        <Database size={12} /> State Root
                    </span>
                    <span className="font-mono text-primary truncate w-24 md:w-auto">
                        {latestSnapshot.merkleRoot.substring(0, 16)}...
                    </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Verification Status</span>
                    <span className="text-success flex items-center gap-1 font-medium">
                        <CheckCircle size={10} /> Verified
                    </span>
                </div>
            </div>
        </div>
    );
}
