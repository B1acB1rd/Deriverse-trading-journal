'use client';

import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Trash2, Download, Database, Wifi, Check } from 'lucide-react';
import { useTradeData } from '../../hooks/useTradeData';

export default function SettingsPage() {
    const { refreshData } = useTradeData();
    const [rpcEndpoint, setRpcEndpoint] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Load saved RPC endpoint on mount
    useEffect(() => {
        const saved = localStorage.getItem('deriverse_custom_rpc');
        if (saved) setRpcEndpoint(saved);
    }, []);

    const handleSaveRpc = () => {
        if (rpcEndpoint.trim()) {
            localStorage.setItem('deriverse_custom_rpc', rpcEndpoint.trim());
        } else {
            localStorage.removeItem('deriverse_custom_rpc');
        }
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleForceRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshData();
        } catch (e) {
            console.error('[Settings] Force refresh failed:', e);
        }
        setIsRefreshing(false);
    };

    const handleExportJournal = () => {
        // Collect all journal data from localStorage
        const journalRaw = localStorage.getItem('deriverse_journal_entries');
        const journalData = journalRaw ? JSON.parse(journalRaw) : {};

        const exportPayload = {
            exported_at: new Date().toISOString(),
            entry_count: Object.keys(journalData).length,
            entries: journalData
        };

        const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `deriverse-journal-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleClearValues = () => {
        if (confirm('Are you sure you want to clear all local journal data? This cannot be undone.')) {
            localStorage.removeItem('deriverse_journal_entries');
            window.location.reload();
        }
    };

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-text-primary">Settings</h2>
                    <p className="text-sm text-text-muted">Configure your workspace and manage data.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Network Settings */}
                <div className="glass-panel p-4 md:p-6 rounded-2xl space-y-4 md:space-y-6">
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
                                className="flex-1 bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-solana-purple outline-none"
                            />
                            <button
                                onClick={handleSaveRpc}
                                className={`px-4 text-white rounded-lg transition-colors flex items-center gap-2 shrink-0 ${isSaved ? 'bg-green-600' : 'bg-solana-purple hover:bg-solana-purple-dark'
                                    }`}
                            >
                                {isSaved ? <><Check className="w-4 h-4" /> Saved</> : <Save className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-xs text-white/40 mt-2">
                            Use a private RPC (Helius, QuickNode) for faster data loading and to avoid rate limits.
                            {rpcEndpoint && <span className="text-solana-purple ml-1">Active</span>}
                        </p>
                    </div>
                </div>

                {/* Data Management */}
                <div className="glass-panel p-4 md:p-6 rounded-2xl space-y-4 md:space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Database className="w-5 h-5 text-solana-purple" />
                        <h3 className="text-lg font-bold text-white">Data Management</h3>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleExportJournal}
                            className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 flex items-center justify-between group transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Download className="w-5 h-5 text-white/40 group-hover:text-white" />
                                <div className="text-left">
                                    <h4 className="text-sm font-medium text-white">Export Journal Data</h4>
                                    <p className="text-xs text-white/40">Download your logs as JSON</p>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={handleForceRefresh}
                            disabled={isRefreshing}
                            className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 flex items-center justify-between group transition-colors disabled:opacity-50"
                        >
                            <div className="flex items-center gap-3">
                                <RefreshCw className={`w-5 h-5 text-white/40 group-hover:text-white ${isRefreshing ? 'animate-spin' : ''}`} />
                                <div className="text-left">
                                    <h4 className="text-sm font-medium text-white">
                                        {isRefreshing ? 'Refreshing...' : 'Force Refresh'}
                                    </h4>
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
            </div>
        </div>
    );
}
