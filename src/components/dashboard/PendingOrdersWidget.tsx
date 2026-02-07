'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, XCircle, AlertCircle } from 'lucide-react';
import { useTradeData } from '../../hooks/useTradeData';

export function PendingOrdersWidget() {
    const { openOrders, isLoading } = useTradeData();

    if (isLoading) {
        return (
            <div className="glass-panel p-6 rounded-2xl animate-pulse h-48">
                <div className="h-6 w-32 bg-white/10 rounded mb-4" />
                <div className="space-y-3">
                    <div className="h-12 bg-white/5 rounded-xl" />
                    <div className="h-12 bg-white/5 rounded-xl" />
                </div>
            </div>
        );
    }

    // Filter to only show actual open orders if any
    const activeOrders = openOrders || [];

    return (
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-solana-purple" />
                    <h3 className="text-lg font-semibold text-white">Pending Orders</h3>
                </div>
                <span className="text-xs font-mono text-white/40 bg-white/5 px-2 py-1 rounded-lg">
                    {activeOrders.length} ACTIVE
                </span>
            </div>

            {/* List */}
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {activeOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center bg-white/5 rounded-xl border border-dashed border-white/10">
                        <AlertCircle className="w-8 h-8 text-white/20 mb-2" />
                        <p className="text-sm text-white/40">No active limit orders</p>
                        <p className="text-xs text-white/20 mt-1">Orders waiting to fill will appear here</p>
                    </div>
                ) : (
                    activeOrders.map((order, idx) => (
                        <motion.div
                            key={order.id || idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors flex items-center justify-between group/item"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-1 h-8 rounded-full ${order.side === 'LONG' || order.type?.includes('Buy') ? 'bg-solana-green' : 'bg-red-500'}`} />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-white">{order.symbol || 'SOL-PERP'}</span>
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${order.side === 'LONG' || order.type?.includes('Buy')
                                                ? 'bg-solana-green/10 text-solana-green'
                                                : 'bg-red-500/10 text-red-500'
                                            }`}>
                                            {order.side || (order.type?.includes('Buy') ? 'LONG' : 'SHORT')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-white/60 mt-0.5">
                                        <span>Limit: <span className="text-white font-mono">${order.price}</span></span>
                                        <span>Size: <span className="text-white font-mono">{order.quantity}</span></span>
                                    </div>
                                </div>
                            </div>

                            <button
                                className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-red-400 transition-colors opacity-0 group-hover/item:opacity-100"
                                title="Cancel Order"
                            >
                                <XCircle className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-solana-purple/5 blur-[50px] pointer-events-none" />
        </div>
    );
}
