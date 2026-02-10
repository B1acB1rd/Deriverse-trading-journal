'use client';

import React, { useState } from 'react';
import { Save, RefreshCw, Trash2, Download, Monitor, Database, Wifi } from 'lucide-react';
import { useTradeData } from '../../hooks/useTradeData';

export default function SettingsPage() {
    const { refreshData } = useTradeData();
    const [rpcEndpoint, setRpcEndpoint] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    const handleSaveRpc = () => {

        localStorage.setItem('deriverse_custom_rpc', rpcEndpoint);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleClearValues = () => {
        if (confirm('Are you sure you want to clear all local journal data? This cannot be undone.')) {
            localStorage.removeItem('deriverse_journal_entries'); // Adjust key as needed
            window.location.reload();
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">Settings</h2>
                    <p className="text-text-muted">Configure your workspace and manage data.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Network Settings */}
                <div className="glass-panel p-6 rounded-2xl space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Wifi className="w-5 h-5 text-solana-purple" />
                        <h3 className="text-lg font-bold text-white">Network Connection</h3>
                    </div>

                    <div>
                        <label className="block text-sm text-text-muted mb-2">Custom RPC Endpoint</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={rpcEndpoint}
                                onChange={(e) => setRpcEndpoint(e.target.value)}
                                placeholder="https://..."
                                className="flex-1 bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-solana-purple outline-none"
                            />
                            <button
                                onClick={handleSaveRpc}
                                className="px-4 bg-solana-purple hover:bg-solana-purple-dark text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                                {isSaved ? "Saved" : <Save className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-xs text-white/40 mt-2">
                            Use a private RPC (Helius, QuickNode) for faster data loading and to avoid rate limits.
                        </p>
                    </div>
                </div>

                {/* Data Management */}
                <div className="glass-panel p-6 rounded-2xl space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Database className="w-5 h-5 text-solana-purple" />
                        <h3 className="text-lg font-bold text-white">Data Management</h3>
                    </div>

                    <div className="space-y-3">
                        <button className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 flex items-center justify-between group transition-colors">
                            <div className="flex items-center gap-3">
                                <Download className="w-5 h-5 text-white/40 group-hover:text-white" />
                                <div className="text-left">
                                    <h4 className="text-sm font-medium text-white">Export Journal Data</h4>
                                    <p className="text-xs text-white/40">Download your logs as JSON</p>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={refreshData}
                            className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 flex items-center justify-between group transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <RefreshCw className="w-5 h-5 text-white/40 group-hover:text-white" />
                                <div className="text-left">
                                    <h4 className="text-sm font-medium text-white">Force Refresh</h4>
                                    <p className="text-xs text-white/40">Resync on-chain data</p>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={handleClearValues}
                            className="w-full p-4 bg-red-500/10 hover:bg-red-500/20 rounded-xl border border-red-500/20 flex items-center justify-between group transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Trash2 className="w-5 h-5 text-red-500/60 group-hover:text-red-500" />
                                <div className="text-left">
                                    <h4 className="text-sm font-medium text-red-400">Clear Local Storage</h4>
                                    <p className="text-xs text-red-400/50">Delete all journal notes</p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Appearance */}
                <div className="glass-panel p-6 rounded-2xl space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Monitor className="w-5 h-5 text-solana-purple" />
                        <h3 className="text-lg font-bold text-white">Appearance</h3>
                    </div>

                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-white">Theme Mode</span>
                            <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/60">Dark Mode Locked</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
