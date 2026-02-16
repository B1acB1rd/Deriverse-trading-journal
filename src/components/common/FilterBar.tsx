"use client";

import React, { useMemo } from "react";
import { useTradeData } from "@/hooks/useTradeData";
import { Filter, X, Calendar, TrendingUp, Layers, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterPillProps = {
    label: string;
    active: boolean;
    onClick: () => void;
    variant?: "default" | "long" | "short";
};

function FilterPill({ label, active, onClick, variant = "default" }: FilterPillProps) {
    const activeColors = {
        default: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
        long: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        short: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    };
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-2.5 py-1 text-[11px] font-medium rounded-md border transition-all duration-200",
                active
                    ? activeColors[variant]
                    : "bg-transparent text-slate-500 border-slate-700/50 hover:text-slate-300 hover:border-slate-600"
            )}
        >
            {label}
        </button>
    );
}

export function FilterBar() {
    const {
        trades,
        allTrades,
        dateRange,
        setDateRange,
        symbolFilter,
        setSymbolFilter,
        sideFilter,
        setSideFilter,
        marketTypeFilter,
        setMarketTypeFilter,
    } = useTradeData();

    // Derive available symbols from all trades
    const availableSymbols = useMemo(() => {
        const symbols = new Set<string>();
        allTrades.forEach((t) => symbols.add(t.symbol));
        return Array.from(symbols).sort();
    }, [allTrades]);

    const hasActiveFilters =
        dateRange !== "ALL" ||
        symbolFilter !== "ALL" ||
        sideFilter !== "ALL" ||
        marketTypeFilter !== "ALL";

    const clearAll = () => {
        setDateRange("ALL");
        setSymbolFilter("ALL");
        setSideFilter("ALL");
        setMarketTypeFilter("ALL");
    };

    return (
        <div className="glass-panel rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Filters
                    </span>
                    <span className="text-[10px] text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded-full">
                        {trades.length} / {allTrades.length}
                    </span>
                </div>
                {hasActiveFilters && (
                    <button
                        onClick={clearAll}
                        className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        <X className="w-3 h-3" />
                        Clear All
                    </button>
                )}
            </div>

            <div className="flex flex-wrap gap-4">
                {/* Timeframe */}
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase tracking-wider">
                        <Calendar className="w-3 h-3" />
                        Period
                    </div>
                    <div className="flex gap-1">
                        {(["7D", "30D", "90D", "ALL"] as const).map((r) => (
                            <FilterPill
                                key={r}
                                label={r === "ALL" ? "All" : r}
                                active={dateRange === r}
                                onClick={() => setDateRange(r)}
                            />
                        ))}
                    </div>
                </div>

                {/* Side */}
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase tracking-wider">
                        <TrendingUp className="w-3 h-3" />
                        Side
                    </div>
                    <div className="flex gap-1">
                        <FilterPill
                            label="All"
                            active={sideFilter === "ALL"}
                            onClick={() => setSideFilter("ALL")}
                        />
                        <FilterPill
                            label="Long"
                            active={sideFilter === "LONG"}
                            onClick={() => setSideFilter("LONG")}
                            variant="long"
                        />
                        <FilterPill
                            label="Short"
                            active={sideFilter === "SHORT"}
                            onClick={() => setSideFilter("SHORT")}
                            variant="short"
                        />
                    </div>
                </div>

                {/* Market Type */}
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase tracking-wider">
                        <Layers className="w-3 h-3" />
                        Market
                    </div>
                    <div className="flex gap-1">
                        {(["ALL", "spot", "perpetual"] as const).map((mt) => (
                            <FilterPill
                                key={mt}
                                label={mt === "ALL" ? "All" : mt === "perpetual" ? "Perp" : "Spot"}
                                active={marketTypeFilter === mt}
                                onClick={() => setMarketTypeFilter(mt)}
                            />
                        ))}
                    </div>
                </div>

                {/* Symbol */}
                {availableSymbols.length > 1 && (
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase tracking-wider">
                            <BarChart3 className="w-3 h-3" />
                            Symbol
                        </div>
                        <div className="flex gap-1 flex-wrap">
                            <FilterPill
                                label="All"
                                active={symbolFilter === "ALL"}
                                onClick={() => setSymbolFilter("ALL")}
                            />
                            {availableSymbols.map((sym) => (
                                <FilterPill
                                    key={sym}
                                    label={sym.replace("/USDC", "").replace("-PERP", "")}
                                    active={symbolFilter === sym}
                                    onClick={() => setSymbolFilter(sym)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
