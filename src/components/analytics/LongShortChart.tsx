"use client";

import React, { useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Cell,
} from "recharts";
import { useTradeData } from "@/hooks/useTradeData";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

export function LongShortChart() {
    const { trades } = useTradeData();

    const data = useMemo(() => {
        const closedTrades = trades.filter(
            (t) => (t.status === "CLOSED" || t.status === undefined) && t.pnl !== 0
        );

        const longTrades = closedTrades.filter((t) => t.side === "LONG");
        const shortTrades = closedTrades.filter((t) => t.side === "SHORT");

        const longPnl = longTrades.reduce((a, t) => a + t.pnl, 0);
        const shortPnl = shortTrades.reduce((a, t) => a + t.pnl, 0);

        const longWins = longTrades.filter((t) => t.pnl > 0).length;
        const shortWins = shortTrades.filter((t) => t.pnl > 0).length;

        return {
            chartData: [
                {
                    name: "Trades",
                    Long: longTrades.length,
                    Short: shortTrades.length,
                },
                {
                    name: "Wins",
                    Long: longWins,
                    Short: shortWins,
                },
            ],
            pnlData: [
                { name: "Long PnL", value: longPnl, fill: longPnl >= 0 ? "#34d399" : "#f87171" },
                { name: "Short PnL", value: shortPnl, fill: shortPnl >= 0 ? "#34d399" : "#f87171" },
            ],
            summary: {
                longCount: longTrades.length,
                shortCount: shortTrades.length,
                longPnl,
                shortPnl,
                longWinRate: longTrades.length > 0 ? (longWins / longTrades.length) * 100 : 0,
                shortWinRate: shortTrades.length > 0 ? (shortWins / shortTrades.length) * 100 : 0,
                ratio: shortTrades.length > 0 ? longTrades.length / shortTrades.length : longTrades.length,
            },
        };
    }, [trades]);

    return (
        <div className="glass-panel rounded-xl p-5">
            <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Long / Short Analysis
            </h3>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
                    <div className="text-[10px] uppercase tracking-wider text-emerald-500/70 mb-1">Long</div>
                    <div className="text-lg font-bold text-emerald-400 font-mono">{formatCurrency(data.summary.longPnl)}</div>
                    <div className="text-[10px] text-slate-500">
                        {data.summary.longCount} trades · {data.summary.longWinRate.toFixed(0)}% WR
                    </div>
                </div>
                <div className="bg-rose-500/5 border border-rose-500/10 rounded-lg p-3">
                    <div className="text-[10px] uppercase tracking-wider text-rose-500/70 mb-1">Short</div>
                    <div className="text-lg font-bold text-rose-400 font-mono">{formatCurrency(data.summary.shortPnl)}</div>
                    <div className="text-[10px] text-slate-500">
                        {data.summary.shortCount} trades · {data.summary.shortWinRate.toFixed(0)}% WR
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.pnlData} barCategoryGap="30%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} />
                        <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                        <Tooltip
                            contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }}
                            labelStyle={{ color: "#94a3b8" }}
                            formatter={(value: any) => [formatCurrency(Number(value)), "PnL"]}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {data.pnlData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.8} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="text-center text-[10px] text-slate-500 mt-2">
                L/S Ratio: <span className="text-slate-300 font-mono">{data.summary.ratio.toFixed(2)}</span>
            </div>
        </div>
    );
}
