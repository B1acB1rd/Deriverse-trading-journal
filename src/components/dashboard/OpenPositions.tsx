"use client";

import React, { useMemo } from "react";
import { useTradeData } from "@/hooks/useTradeData";
import { formatCurrency } from "@/lib/utils";
import { ExternalLink, Circle, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function OpenPositions() {
    const { trades } = useTradeData();

    // Derive open positions from trades with status OPEN or PENDING
    const positions = useMemo(
        () => trades.filter(t => t.status === 'OPEN' || t.status === 'PENDING'),
        [trades]
    );

    if (!positions || positions.length === 0) {
        return (
            <div className="glass-panel rounded-xl p-5">
                <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                    <Circle className="w-3 h-3 fill-emerald-400 text-emerald-400 animate-pulse" />
                    Open Positions
                </h3>
                <div className="flex items-center justify-center text-slate-500 text-sm py-8">
                    No open positions
                </div>
            </div>
        );
    }

    const totalUnrealized = positions.reduce((a: number, p: any) => a + (p.pnl || p.unrealizedPnl || 0), 0);

    return (
        <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <Circle className="w-3 h-3 fill-emerald-400 text-emerald-400 animate-pulse" />
                    Open Positions
                    <span className="text-[10px] font-normal text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded-full">
                        {positions.length}
                    </span>
                </h3>
                <div className={cn("text-sm font-bold font-mono", totalUnrealized >= 0 ? "text-emerald-400" : "text-rose-400")}>
                    {totalUnrealized > 0 ? "+" : ""}{formatCurrency(totalUnrealized)}
                </div>
            </div>

            <div className="space-y-2">
                {positions.map((pos: any, i: number) => {
                    const pnl = pos.pnl || pos.unrealizedPnl || 0;
                    const isLong = (pos.side || pos.type || "").toUpperCase().includes("LONG") ||
                        (pos.baseAssetAmount || 0) > 0;
                    const symbol = pos.symbol || pos.marketName || `Position ${i + 1}`;
                    const size = pos.size || pos.baseAssetAmount || 0;
                    const entryPrice = pos.entryPrice || pos.averageEntryPrice || 0;

                    return (
                        <div
                            key={i}
                            className="flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.04] border border-slate-800/40 rounded-lg p-3 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-1 h-8 rounded-full",
                                    isLong ? "bg-emerald-500" : "bg-rose-500"
                                )} />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-slate-200">{symbol}</span>
                                        <span className={cn(
                                            "text-[9px] font-medium px-1.5 py-0.5 rounded uppercase",
                                            isLong
                                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                        )}>
                                            {isLong ? "LONG" : "SHORT"}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">
                                        Size: <span className="text-slate-400 font-mono">{Math.abs(size).toFixed(4)}</span>
                                        {entryPrice > 0 && (
                                            <> · Entry: <span className="text-slate-400 font-mono">{formatCurrency(entryPrice)}</span></>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <div className={cn("text-sm font-bold font-mono", pnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                        {pnl > 0 ? "+" : ""}{formatCurrency(pnl)}
                                    </div>
                                    {pnl >= 0 ? (
                                        <TrendingUp className="w-3 h-3 text-emerald-500/50 ml-auto" />
                                    ) : (
                                        <TrendingDown className="w-3 h-3 text-rose-500/50 ml-auto" />
                                    )}
                                </div>
                                <a
                                    href="https://app.deriverse.io/trade"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-indigo-400 transition-all p-1"
                                    title="Close on Deriverse"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
