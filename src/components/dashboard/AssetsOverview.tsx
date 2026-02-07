'use client';

import React from 'react';
import { useTradeData } from '@/hooks/useTradeData';
import { Wallet, Coins, Briefcase, TrendingUp, Receipt, Droplet, DollarSign } from 'lucide-react';

export function AssetsOverview() {
    const { assets, isLoading, isWalletConnected, totalVolume, totalFees, lpPositions, pnl } = useTradeData();

    // Default values if data not loaded
    const solBalance = assets?.sol || 0;
    const usdcBalance = assets?.usdc || 0;
    const subaccountEquity = assets?.deriverse || 0;

    // LP Position data
    const totalLpTokens = lpPositions?.reduce((sum: number, lp: any) => sum + (lp.lpTokens || 0), 0) || 0;

    if (!isWalletConnected) return null;

    if (isLoading) {
        return <div className="glass-panel h-32 animate-pulse mb-6 rounded-xl"></div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
            {/* Wallet SOL */}
            <div className="glass-panel p-5 rounded-xl flex items-center gap-3 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                    <Wallet size={20} />
                </div>
                <div>
                    <h3 className="text-text-muted text-[10px] uppercase font-bold tracking-wider">SOL Balance</h3>
                    <div className="text-lg font-bold font-mono text-white">
                        {solBalance.toFixed(3)}
                    </div>
                </div>
            </div>

            {/* Wallet USDC */}
            <div className="glass-panel p-5 rounded-xl flex items-center gap-3 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <Coins size={20} />
                </div>
                <div>
                    <h3 className="text-text-muted text-[10px] uppercase font-bold tracking-wider">USDC Balance</h3>
                    <div className="text-lg font-bold font-mono text-white">
                        ${usdcBalance.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* LP Positions - NEW */}
            <div className="glass-panel p-5 rounded-xl flex items-center gap-3 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 shrink-0">
                    <Droplet size={20} />
                </div>
                <div>
                    <h3 className="text-text-muted text-[10px] uppercase font-bold tracking-wider">LP Tokens</h3>
                    <div className="text-lg font-bold font-mono text-white">
                        {totalLpTokens.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Subaccount Equity */}
            <div className="glass-panel p-5 rounded-xl flex items-center gap-3 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <Briefcase size={20} />
                </div>
                <div>
                    <h3 className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Equity</h3>
                    <div className="text-lg font-bold font-mono text-white">
                        ${subaccountEquity.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Realized PnL - NEW */}
            <div className="glass-panel p-5 rounded-xl flex items-center gap-3 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                    <DollarSign size={20} />
                </div>
                <div>
                    <h3 className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Realized PnL</h3>
                    <div className={`text-lg font-bold font-mono ${(pnl?.realized || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        ${(pnl?.realized || 0).toFixed(4)}
                    </div>
                </div>
            </div>

            {/* Total Volume */}
            <div className="glass-panel p-5 rounded-xl flex items-center gap-3 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 shrink-0">
                    <TrendingUp size={20} />
                </div>
                <div>
                    <h3 className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Total Volume</h3>
                    <div className="text-lg font-bold font-mono text-white">
                        ${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
            </div>

            {/* Total Fees */}
            <div className="glass-panel p-5 rounded-xl flex items-center gap-3 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                    <Receipt size={20} />
                </div>
                <div>
                    <h3 className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Fees Paid</h3>
                    <div className="text-lg font-bold font-mono text-red-400">
                        -${totalFees.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </div>
                </div>
            </div>
        </div>
    );
}

