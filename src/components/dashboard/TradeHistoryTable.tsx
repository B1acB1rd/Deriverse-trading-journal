"use client";

import React, { useState, useMemo } from "react";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
    createColumnHelper,
    SortingState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { toDate, getCoinLogo, formatCurrency, formatPercentage, cn, formatDuration } from "@/lib/utils";
import {
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    StickyNote,
    Tag,
    X,
    Search
} from "lucide-react";
import type { Trade } from "@/types";
import Image from "next/image";

// --- Inline UI Components (since shared lib is missing) ---

const Badge = ({ children, variant, className }: { children: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'danger' | 'info', className?: string }) => {
    const variants = {
        default: "bg-slate-700/50 text-slate-300 border-slate-600/50",
        success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        danger: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    };
    return (
        <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wide", variants[variant || 'default'], className)}>
            {children}
        </span>
    );
};

const Button = ({ children, variant = 'default', size = 'default', onClick, disabled, className }: {
    children: React.ReactNode;
    variant?: 'default' | 'ghost' | 'outline';
    size?: 'default' | 'sm' | 'icon';
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
}) => {
    const base = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-slate-900";
    const variants = {
        default: "bg-slate-800 text-slate-200 hover:bg-slate-700",
        ghost: "bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200",
        outline: "border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300"
    };
    const sizes = {
        default: "h-10 py-2 px-4",
        sm: "h-8 px-3 text-xs",
        icon: "h-9 w-9",
    };
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(base, variants[variant], sizes[size], className)}
        >
            {children}
        </button>
    );
};

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("rounded-xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-md shadow-sm", className)}>
        {children}
    </div>
);

// --- Table Implementation ---

const columnHelper = createColumnHelper<Trade>();

interface TradeHistoryTableProps {
    trades: Trade[];
    onAddNote?: (tradeId: string) => void;
    onCloseTrade?: (trade: Trade) => void;
}

export function TradeHistoryTable({ trades, onCloseTrade }: TradeHistoryTableProps) {
    const [sorting, setSorting] = useState<SortingState>([
        { id: "timestamp", desc: true },
    ]);
    const [globalFilter, setGlobalFilter] = useState("");

    const columns = useMemo(
        () => [
            columnHelper.accessor("timestamp", {
                header: ({ column }) => (
                    <button
                        className="flex items-center gap-1 hover:text-slate-300 transition-colors"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Date
                        <ArrowUpDown className="w-3 h-3 opacity-50" />
                    </button>
                ),
                cell: (info) => (
                    <div className="text-sm">
                        <p className="text-slate-200 font-medium tabular-nums">{format(toDate(info.getValue()), "MMM dd")}</p>
                        <p className="text-slate-500 text-[10px] tabular-nums">{format(toDate(info.getValue()), "HH:mm:ss")}</p>
                    </div>
                ),
            }),
            columnHelper.accessor("symbol", {
                header: "Symbol",
                cell: (info) => (
                    <div className="flex items-center gap-2">
                        <div className="relative w-5 h-5 rounded-full overflow-hidden bg-slate-800 ring-1 ring-slate-700/50">
                            {/* Use simple img tag if next/image fails or needs config. Using standard img for resilience */}
                            <img
                                src={getCoinLogo(info.getValue())}
                                alt={info.getValue()}
                                className="object-cover w-full h-full"
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'; }}
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-200 text-sm">{info.getValue().replace('SOL-PERP', 'SOL')}</span>
                                <Badge variant={info.row.original.marketType === "spot" ? "info" : "warning"}>
                                    {info.row.original.marketType === 'perpetual' ? 'PERP' : 'SPOT'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                ),
            }),
            columnHelper.accessor("side", {
                header: "Side",
                cell: (info) => (
                    <Badge variant={info.getValue() === "LONG" ? "success" : "danger"}>
                        {info.getValue()}
                    </Badge>
                ),
            }),
            columnHelper.accessor("price", {
                header: "Entry Price",
                cell: (info) => (
                    <span className="tabular-nums text-slate-300 font-medium font-mono text-xs">
                        {formatCurrency(info.row.original.entryPrice || info.getValue())}
                    </span>
                ),
            }),
            columnHelper.accessor("exitPrice", {
                header: "Exit Price",
                cell: (info) => {
                    const val = info.getValue();
                    return val ? (
                        <span className="tabular-nums text-slate-300 font-medium font-mono text-xs">{formatCurrency(val)}</span>
                    ) : <span className="text-slate-600">-</span>;
                },
            }),
            columnHelper.accessor("size", {
                header: "Size",
                cell: (info) => <span className="tabular-nums text-slate-400 font-mono text-xs">{info.getValue().toFixed(4)}</span>,
            }),
            columnHelper.accessor("pnl", {
                header: ({ column }) => (
                    <button
                        className="flex items-center gap-1 hover:text-slate-300 transition-colors"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        PnL
                        <ArrowUpDown className="w-3 h-3 opacity-50" />
                    </button>
                ),
                cell: (info) => {
                    const pnl = info.getValue();
                    // Calculate percentage if not available
                    const entryVal = (info.row.original.entryPrice || info.row.original.price) * info.row.original.size;
                    const percentage = entryVal > 0 ? (pnl / entryVal) : 0;

                    if (pnl === 0 && info.row.original.status === 'OPEN') {
                        return <span className="text-slate-500 italic text-xs">Open</span>;
                    }

                    return (
                        <div className="flex flex-col items-end">
                            <span className={cn("font-bold tabular-nums font-mono text-sm", pnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                {pnl > 0 ? '+' : ''}{formatCurrency(pnl)}
                            </span>
                            <span className={cn("text-[10px] tabular-nums", pnl >= 0 ? "text-emerald-500/70" : "text-rose-500/70")}>
                                {pnl > 0 ? '+' : ''}{formatPercentage(percentage)}
                            </span>
                        </div>
                    );
                },
            }),
            columnHelper.accessor("fees", {
                header: "Fees",
                cell: (info) => (
                    <span className="text-amber-500/80 tabular-nums font-mono text-xs">{formatCurrency(Math.abs(info.getValue()))}</span>
                ),
            }),
            columnHelper.accessor("status", {
                header: "Status",
                cell: (info) => {
                    const status = info.getValue();
                    const variant = status === 'CLOSED' ? 'default' : status === 'OPEN' ? 'success' : 'danger';
                    return <Badge variant={variant as any}>{status}</Badge>;
                }
            }),
            columnHelper.accessor("chainTx", {
                header: "",
                id: "actions",
                cell: (info) => (
                    <a
                        href={`https://explorer.solana.com/tx/${info.getValue()}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-600 hover:text-indigo-400 transition-colors p-1"
                        title="View on Explorer"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                )
            })
        ],
        [onCloseTrade]
    );

    const table = useReactTable({
        data: trades,
        columns,
        state: {
            sorting,
            globalFilter,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    return (
        <Card className="flex flex-col h-full bg-[#0B0F19]/80 border-slate-800/50">
            <div className="p-4 border-b border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                    Trade History
                    <span className="text-xs font-normal text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-full">
                        {trades.length}
                    </span>
                </h3>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search symbol, side, status..."
                        value={globalFilter ?? ""}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg pl-9 pr-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-900/30 sticky top-0 backdrop-blur-sm z-10">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id} className="border-b border-slate-800/50">
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider hover:bg-slate-800/20 transition-colors cursor-pointer select-none"
                                        onClick={header.column.getToggleSortingHandler()}
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                        {table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500 text-sm">
                                    No trades found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="hover:bg-slate-800/30 transition-colors group"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="px-4 py-3 text-sm text-slate-400 whitespace-nowrap">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t border-slate-800/50 bg-slate-900/20 mt-auto">
                <div className="text-xs text-slate-500">
                    Showing <span className="text-slate-300 font-medium">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span> to{" "}
                    <span className="text-slate-300 font-medium">
                        {Math.min(
                            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                            table.getFilteredRowModel().rows.length
                        )}
                    </span>{" "}
                    of <span className="text-slate-300 font-medium">{table.getFilteredRowModel().rows.length}</span> trades
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs text-slate-500 font-mono bg-slate-800/50 px-2 py-1 rounded">
                        {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </Card>
    );
}
