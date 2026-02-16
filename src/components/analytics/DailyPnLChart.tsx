"use client";

import React, { useMemo, useState } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    BarChart,
    Bar,
    Cell,
} from "recharts";
import { useTradeData } from "@/hooks/useTradeData";
import { generateDailyPerformance } from "@/lib/metrics";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { BarChart3 } from "lucide-react";

type ViewMode = "daily" | "cumulative";

export function DailyPnLChart() {
    const { trades } = useTradeData();
    const [viewMode, setViewMode] = useState<ViewMode>("cumulative");

    const dailyData = useMemo(() => generateDailyPerformance(trades), [trades]);

    const chartData = useMemo(
        () =>
            dailyData.map((d) => ({
                date: format(d.date, "MMM dd"),
                rawDate: d.date,
                pnl: d.pnl,
                cumulativePnl: d.cumulativePnl,
                tradeCount: d.tradeCount,
                winCount: d.winCount,
                lossCount: d.lossCount,
            })),
        [dailyData]
    );

    if (chartData.length === 0) {
        return (
            <div className="glass-panel rounded-xl p-5 flex items-center justify-center h-64 text-slate-500 text-sm">
                No daily performance data available
            </div>
        );
    }

    return (
        <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                    PnL History
                </h3>
                <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-0.5">
                    {(["daily", "cumulative"] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-all ${viewMode === mode
                                ? "bg-indigo-500/20 text-indigo-300"
                                : "text-slate-500 hover:text-slate-300"
                                }`}
                        >
                            {mode === "daily" ? "Daily" : "Cumulative"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    {viewMode === "cumulative" ? (
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis
                                dataKey="date"
                                tick={{ fill: "#64748b", fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fill: "#64748b", fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v) => `$${v.toFixed(0)}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#0f172a",
                                    border: "1px solid #1e293b",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                }}
                                formatter={(value: any) => [formatCurrency(Number(value)), "Cumulative PnL"]}
                            />
                            <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
                            <Area
                                type="monotone"
                                dataKey="cumulativePnl"
                                stroke="#818cf8"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorPnl)"
                            />
                        </AreaChart>
                    ) : (
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis
                                dataKey="date"
                                tick={{ fill: "#64748b", fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fill: "#64748b", fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v) => `$${v.toFixed(0)}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#0f172a",
                                    border: "1px solid #1e293b",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                }}
                                formatter={(value: any) => [formatCurrency(Number(value)), "Daily PnL"]}
                            />
                            <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
                            <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.pnl >= 0 ? "#34d399" : "#f87171"}
                                        fillOpacity={0.8}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
}
