'use client';

import React, { useState } from 'react';
import { useTradeData } from '@/hooks/useTradeData';
import { Trade } from '@/types';
import { formatCurrency, formatPercentage, cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, AlertTriangle, Tag, Edit3, Share2, AlertCircle, Check } from 'lucide-react';
import s from './TradeHistory.module.css';

export function TradeHistoryTable() {
    const { trades, openOrders, isLoading } = useTradeData();
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [filter, setFilter] = useState('ALL');
    const [view, setView] = useState<'HISTORY' | 'ORDERS'>('HISTORY');
    const [notes, setNotes] = useState<Record<string, string>>({});

    if (isLoading) return <div className={s.container}><p>Loading trades...</p></div>;

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const filteredTrades = filter === 'ALL' ? trades : trades.filter(t => t.side === filter);

    const getMevColor = (confidence?: number): 'high' | 'medium' | 'low' => {
        if (!confidence) return 'low';
        if (confidence > 0.6) return 'high';
        if (confidence > 0.3) return 'medium';
        return 'low';
    };

    return (
        <div className={s.container}>
            <div className={s.header}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <h3
                        className={s.title}
                        style={{ cursor: 'pointer', opacity: view === 'HISTORY' ? 1 : 0.5 }}
                        onClick={() => setView('HISTORY')}
                    >
                        Trade Journal
                    </h3>
                    <h3
                        className={s.title}
                        style={{ cursor: 'pointer', opacity: view === 'ORDERS' ? 1 : 0.5 }}
                        onClick={() => setView('ORDERS')}
                    >
                        Active Orders {openOrders?.length > 0 && `(${openOrders.length})`}
                    </h3>
                </div>

                {view === 'HISTORY' && (
                    <div className={s.filterGroup}>
                        {['ALL', 'LONG', 'SHORT'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(s.filterBtn, filter === f && s.active)}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className={s.tableWrapper}>
                {view === 'HISTORY' ? (
                    <table className={s.table}>
                        <thead className={s.thead}>
                            <tr>
                                <th className={s.th} style={{ width: '2rem' }}></th>
                                <th className={s.th}>Date</th>
                                <th className={s.th}>Symbol</th>
                                <th className={s.th}>Side</th>
                                <th className={s.th}>Size</th>
                                <th className={s.th}>Price</th>
                                <th className={s.th}>PnL</th>
                                <th className={s.th}>MEV Risk</th>
                            </tr>
                        </thead>
                        <tbody className={s.tbody}>
                            {filteredTrades.map((trade) => (
                                <React.Fragment key={trade.id}>
                                    <tr
                                        className={cn(s.tr, expandedId === trade.id && s.expanded)}
                                        onClick={() => toggleExpand(trade.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td className={cn(s.td, s.tdExpander)}>
                                            {expandedId === trade.id ?
                                                <ChevronDown size={16} /> :
                                                <ChevronRight size={16} />
                                            }
                                        </td>
                                        <td className={cn(s.td, s.tdDate)}>
                                            {new Date(trade.timestamp).toLocaleDateString('en-US', {
                                                month: '2-digit',
                                                day: '2-digit',
                                                year: '2-digit'
                                            })}
                                            <span className={s.tdTime}>
                                                {new Date(trade.timestamp).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                    hour12: false
                                                })}
                                            </span>
                                        </td>
                                        <td className={cn(s.td, s.tdSymbol)}>{trade.symbol}</td>
                                        <td className={s.td}>
                                            <span className={cn(s.tdSide, trade.side === 'LONG' ? s.long : s.short)}>
                                                {trade.side}
                                            </span>
                                        </td>
                                        <td className={cn(s.td, s.tdSize)}>
                                            {typeof trade.size === 'number' ?
                                                trade.size.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                                                : trade.size
                                            }
                                        </td>
                                        <td className={cn(s.td, s.tdPrice)}>${trade.price.toFixed(2)}</td>
                                        <td className={cn(s.td, s.tdPnL, trade.pnl > 0 ? s.positive : s.negative)}>
                                            {trade.pnl > 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                                        </td>
                                        <td className={cn(s.td, s.tdMevRisk)}>
                                            {typeof trade.mevConfidence === 'number' && trade.mevConfidence > 0.05 ? (
                                                <div className={cn(s.mevBadge, s[getMevColor(trade.mevConfidence)])}>
                                                    <AlertTriangle size={12} />
                                                    <span>{(trade.mevConfidence * 100).toFixed(0)}%</span>
                                                </div>
                                            ) : (
                                                <span className={cn(s.mevBadge, s.low)}>Clear</span>
                                            )}
                                        </td>
                                    </tr>

                                    {/* Expanded Details Row */}
                                    {expandedId === trade.id && (
                                        <tr className={s.expandedRow}>
                                            <td colSpan={8} className={s.td} style={{ padding: 0 }}>
                                                <div className={s.expandedContent}>
                                                    <div className={s.expandedGrid}>
                                                        {/* Execution Metrics */}
                                                        <div className={s.expandedSection}>
                                                            <h4 className={s.expandedLabel}>
                                                                <AlertCircle size={14} />
                                                                Execution Metrics
                                                            </h4>
                                                            <div className={s.expandedData}>
                                                                <div className={s.expandedDataKey}>Fees</div>
                                                                <div className={s.expandedDataValue}>{formatCurrency(trade.fees)}</div>

                                                                <div className={s.expandedDataKey}>Slippage</div>
                                                                <div className={cn(s.expandedDataValue, trade.slippage > 5 && 'text-danger')}>
                                                                    {formatCurrency(trade.slippage)}
                                                                </div>

                                                                <div className={s.expandedDataKey}>Liquidity</div>
                                                                <div className={s.expandedDataValue}>{trade.liquidityTier}</div>

                                                                <div className={s.expandedDataKey}>Order Type</div>
                                                                <div className={s.expandedDataValue}>{trade.orderType}</div>

                                                                <div className={s.expandedDataKey}>Tx Hash</div>
                                                                <div className={cn(s.expandedDataValue, s.link)}>
                                                                    {trade.chainTx}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* On-Chain Details */}
                                                        <div className={s.expandedSection}>
                                                            <h4 className={s.expandedLabel}>
                                                                <AlertCircle size={14} />
                                                                On-Chain Details
                                                            </h4>
                                                            <div className={s.expandedData}>
                                                                <div className={s.expandedDataKey}>Realized PnL</div>
                                                                <div className={cn(s.expandedDataValue, trade.realizedPnl > 0 && 'text-success', trade.realizedPnl < 0 && 'text-danger')}>
                                                                    {formatCurrency(trade.realizedPnl)}
                                                                </div>

                                                                <div className={s.expandedDataKey}>Unrealized PnL</div>
                                                                <div className={s.expandedDataValue}>{formatCurrency(trade.unrealizedPnl)}</div>

                                                                <div className={s.expandedDataKey}>Wallet</div>
                                                                <div className={s.expandedDataValue}>{trade.wallet}</div>

                                                                <div className={s.expandedDataKey}>Status</div>
                                                                <div className={s.expandedDataValue}>
                                                                    {trade.isOnChain ? <span className="flex items-center gap-1"><Check size={12} /> On-Chain</span> : 'Pending'}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Trader Notes */}
                                                        <div className={s.expandedSection} style={{ gridColumn: '1 / -1' }}>
                                                            <h4 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                                                                <span className={s.expandedLabel}>
                                                                    <Edit3 size={14} />
                                                                    Trader Notes
                                                                </span>
                                                                <span className={s.saveHint}>Auto-saved</span>
                                                            </h4>
                                                            <textarea
                                                                className={s.notesTextarea}
                                                                placeholder="Why did you take this trade? What was your emotion? What would you do differently?"
                                                                value={notes[trade.id] || ''}
                                                                onChange={(e) => setNotes({ ...notes, [trade.id]: e.target.value })}
                                                            />
                                                            <div className={s.tagActions}>
                                                                <button className={s.tagAction}>
                                                                    <Tag size={12} /> Add Tag
                                                                </button>
                                                                <button className={s.tagAction}>
                                                                    <Share2 size={12} /> Share Snapshot
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    // ACTIVE ORDERS TABLE
                    <table className={s.table}>
                        <thead className={s.thead}>
                            <tr>
                                <th className={s.th}>Placed At</th>
                                <th className={s.th}>Symbol</th>
                                <th className={s.th}>Side</th>
                                <th className={s.th}>Type</th>
                                <th className={s.th}>Size</th>
                                <th className={s.th}>Price</th>
                                <th className={s.th}>Filled</th>
                                <th className={s.th}>Status</th>
                            </tr>
                        </thead>
                        <tbody className={s.tbody}>
                            {(!openOrders || openOrders.length === 0) ? (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                                        No active orders found.
                                    </td>
                                </tr>
                            ) : (
                                openOrders.map((order: any, idx: number) => (
                                    <tr key={order.id || idx} className={s.tr}>
                                        <td className={cn(s.td, s.tdDate)}>
                                            {new Date(order.timestamp).toLocaleTimeString()}
                                        </td>
                                        <td className={cn(s.td, s.tdSymbol)}>{order.symbol}</td>
                                        <td className={s.td}>
                                            <span className={cn(s.tdSide, order.side === 'LONG' ? s.long : s.short)}>
                                                {order.side}
                                            </span>
                                        </td>
                                        <td className={s.td}>{order.type}</td>
                                        <td className={cn(s.td, s.tdSize)}>{Number(order.size).toFixed(4)}</td>
                                        <td className={cn(s.td, s.tdPrice)}>${Number(order.price).toFixed(2)}</td>
                                        <td className={s.td}>{(order.filled || 0)}%</td>
                                        <td className={s.td}>
                                            <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '0.75rem' }}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {view === 'HISTORY' && filteredTrades.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.9rem'
                }}>
                    No trades found.
                </div>
            )}
        </div>
    );
}
