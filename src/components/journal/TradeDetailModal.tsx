'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Upload, AlertTriangle, TrendingUp, TrendingDown, Brain, Target, Search, CheckCircle, Edit2 } from 'lucide-react';
import { Trade } from '../../types';
import { useTradeData } from '../../hooks/useTradeData';

interface TradeDetailModalProps {
    trade: Trade;
    onClose: () => void;
}

const TABS = [
    { id: 'execution', label: 'Execution', icon: TrendingUp },
    { id: 'strategy', label: 'Strategy', icon: Target },
    { id: 'psychology', label: 'Psychology', icon: Brain },
    { id: 'analysis', label: 'Simulations', icon: Search },
];

const EMOTIONS = ["Confident", "Anxious", "Fearful", "Greedy", "Bored", "Revenge", "Flow State"];
const MISTAKES = ["Chased Entry", "Wide Stop", "Moved Stop", "Revenge Trade", "Gambling", "Did Not Take Profit", "Hesitation"];

const DEFAULT_SETUPS = [
    { id: '1', name: 'Bull Flag' },
    { id: '2', name: 'Key Level Reversal' },
    { id: '3', name: 'Breakout' },
    { id: '4', name: 'Scalp' }
];

export function TradeDetailModal({ trade, onClose }: TradeDetailModalProps) {
    const { saveJournalEntry } = useTradeData();
    const [activeTab, setActiveTab] = useState('execution');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadedFile, setUploadedFile] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        strategyId: trade.strategyId || '',
        riskReward: trade.riskRewardRatio || 0,
        emotions: trade.emotions || [],
        mistakes: trade.mistakes || [],
        lessons: (trade.lessons || []).join('\n'),
        marketContext: trade.marketContext || '',
        disciplineScore: trade.disciplineScore || 5,
        notes: trade.notes || '',
        // Manual Overrides
        manualEntryPrice: trade.manualEntryPrice || undefined,
        manualFees: trade.manualFees || undefined,
        screenshots: trade.screenshots || []
    });

    const [isEditingEntry, setIsEditingEntry] = useState(false);
    const [isEditingFees, setIsEditingFees] = useState(false);

    const handleSave = () => {
        saveJournalEntry(trade.id, {
            ...formData,
            lessons: formData.lessons.split('\n').filter(l => l.trim().length > 0)
        });
        onClose();
    };

    const toggleSelection = (key: 'emotions' | 'mistakes', value: string) => {
        setFormData(prev => {
            const current = prev[key] || [];
            if (current.includes(value)) {
                return { ...prev, [key]: current.filter(i => i !== value) };
            }
            return { ...prev, [key]: [...current, value] };
        });
    };



    // Calculate display values
    const displayEntryPrice = formData.manualEntryPrice !== undefined ? formData.manualEntryPrice : (trade.price || 0);
    const displayFees = formData.manualFees !== undefined ? formData.manualFees : trade.fees;
    const totalCost = displayFees + trade.slippage;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-4xl bg-gray-900/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${trade.pnl >= 0 ? 'bg-solana-green/20' : 'bg-red-500/20'}`}>
                            {trade.pnl >= 0 ? <TrendingUp className="text-solana-green" /> : <TrendingDown className="text-red-500" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                {trade.symbol}
                                <span className={`text-sm px-2 py-0.5 rounded ${trade.side === 'LONG' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {trade.side}
                                </span>
                            </h2>
                            <p className="text-sm text-text-muted">{new Date(trade.timestamp).toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm text-text-muted">Net PnL</p>
                            <p className={`text-xl font-mono font-bold ${trade.pnl >= 0 ? 'text-solana-green' : 'text-red-500'}`}>
                                {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 flex-1 justify-center
                                ${activeTab === tab.id ? 'border-solana-purple text-white bg-white/5' : 'border-transparent text-text-muted hover:text-white hover:bg-white/5'}`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {/* EXECUTION TAB */}
                    {activeTab === 'execution' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <h4 className="text-sm text-text-muted mb-4 uppercase tracking-wider">Entry & Exit</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-white/60">Entry Price</span>
                                            {isEditingEntry ? (
                                                <input
                                                    type="number"
                                                    autoFocus
                                                    className="w-32 bg-black/40 border border-white/20 rounded px-2 py-1 text-right text-white font-mono text-sm focus:border-solana-purple outline-none"
                                                    value={formData.manualEntryPrice || ''}
                                                    onChange={e => setFormData({ ...formData, manualEntryPrice: parseFloat(e.target.value) })}
                                                    onBlur={() => setIsEditingEntry(false)}
                                                    placeholder="0.00"
                                                />
                                            ) : (
                                                <div
                                                    onClick={() => setIsEditingEntry(true)}
                                                    className="flex items-center gap-2 cursor-pointer group"
                                                >
                                                    <span className="text-white font-mono">
                                                        {displayEntryPrice > 0 ? `$${displayEntryPrice}` : 'Unknown (Market)'}
                                                    </span>
                                                    <Edit2 className="w-3 h-3 text-white/20 group-hover:text-solana-purple" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/60">Exit Price</span>
                                            <span className="text-white font-mono">${trade.price}</span>
                                        </div>
                                        <div className="flex justify-between border-t border-white/5 pt-4">
                                            <span className="text-white/60">Size</span>
                                            <span className="text-white font-mono">{trade.size}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <h4 className="text-sm text-text-muted mb-4 uppercase tracking-wider">Costs & Fees</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-white/60">Network Fees</span>
                                            {isEditingFees ? (
                                                <input
                                                    type="number"
                                                    autoFocus
                                                    className="w-32 bg-black/40 border border-white/20 rounded px-2 py-1 text-right text-white font-mono text-sm focus:border-solana-purple outline-none"
                                                    value={formData.manualFees || ''}
                                                    onChange={e => setFormData({ ...formData, manualFees: parseFloat(e.target.value) })}
                                                    onBlur={() => setIsEditingFees(false)}
                                                    placeholder="0.00"
                                                />
                                            ) : (
                                                <div
                                                    onClick={() => setIsEditingFees(true)}
                                                    className="flex items-center gap-2 cursor-pointer group"
                                                >
                                                    <span className="text-white font-mono text-red-400">
                                                        -${displayFees.toFixed(4)}
                                                    </span>
                                                    <Edit2 className="w-3 h-3 text-white/20 group-hover:text-solana-purple" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/60">Slippage</span>
                                            <span className="text-white font-mono text-red-400">-${trade.slippage.toFixed(4)}</span>
                                        </div>
                                        <div className="flex justify-between border-t border-white/5 pt-4">
                                            <span className="text-white/60">Total Cost</span>
                                            <span className="text-white font-mono text-red-400">-${totalCost.toFixed(4)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <a
                                href={`https://solscan.io/tx/${trade.chainTx || trade.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-4 rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center py-12 text-center hover:bg-white/5 transition-colors cursor-pointer group"
                            >
                                <Search className="w-8 h-8 text-white/20 mb-3 group-hover:text-solana-purple transition-colors" />
                                <h3 className="text-white font-medium">View On Explorer</h3>
                                <p className="text-sm text-text-muted mt-1">Check strict on-chain validation for {(trade.chainTx || trade.id).slice(0, 8)}...</p>
                            </a>
                        </div>
                    )}

                    {/* STRATEGY TAB */}
                    {activeTab === 'strategy' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm text-text-muted mb-2">Strategy Name</label>
                                    <select
                                        value={formData.strategyId}
                                        onChange={(e) => setFormData({ ...formData, strategyId: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-solana-purple outline-none appearance-none"
                                    >
                                        <option value="">Select a Setup...</option>
                                        {DEFAULT_SETUPS.map(setup => (
                                            <option key={setup.id} value={setup.name}>{setup.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-text-muted mb-2">Risk : Reward (Planned)</label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-bold">1 :</span>
                                        <input
                                            type="number"
                                            value={formData.riskReward}
                                            onChange={(e) => setFormData({ ...formData, riskReward: parseFloat(e.target.value) })}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-solana-purple outline-none"
                                            step="0.1"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-text-muted mb-2">Evidence (Screenshots)</label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-solana-purple/50 transition-colors cursor-pointer bg-black/20 relative"
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                const file = e.target.files[0];
                                                setUploadedFile(file.name);
                                                // Convert to Base64 for local storage (Simulated upload)
                                                console.log("Processing file:", file.name);
                                                const reader = new FileReader();
                                                reader.onload = (ev) => {
                                                    const result = ev.target?.result as string;
                                                    console.log("File loaded, length:", result.length);
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        screenshots: [...(prev.screenshots || []), result]
                                                    }));
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                    {uploadedFile ? (
                                        <div className="flex flex-col items-center text-solana-green">
                                            <CheckCircle className="w-8 h-8 mb-2" />
                                            <p>{uploadedFile}</p>
                                            <p className="text-xs text-white/40 mt-1">Image processed & ready to save</p>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="w-8 h-8 text-white/40 mx-auto mb-3" />
                                            <p className="text-white/60">Click or Drag to upload Chart</p>
                                            <p className="text-xs text-white/30 mt-2">Supports .png, .jpg (Max 5MB)</p>
                                        </>
                                    )}
                                </div>
                                {/* Image Preview Grid */}
                                {formData.screenshots && formData.screenshots.length > 0 && (
                                    <div className="mt-4 grid grid-cols-2 gap-4">
                                        {formData.screenshots.map((src, idx) => (
                                            <div key={idx} className="relative group rounded-lg overflow-hidden border border-white/10">
                                                <img src={src} alt={`Evidence ${idx + 1}`} className="w-full h-32 object-cover" />
                                                <button
                                                    onClick={() => setFormData(prev => ({
                                                        ...prev,
                                                        screenshots: prev.screenshots!.filter((_, i) => i !== idx)
                                                    }))}
                                                    className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white/60 hover:text-white hover:bg-red-500/80 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* PSYCHOLOGY TAB */}
                    {activeTab === 'psychology' && (
                        <div className="space-y-8">
                            <div>
                                <h4 className="text-sm text-text-muted mb-4 uppercase tracking-wider">Emotional State</h4>
                                <div className="flex flex-wrap gap-3">
                                    {EMOTIONS.map(emo => (
                                        <button
                                            key={emo}
                                            onClick={() => toggleSelection('emotions', emo)}
                                            className={`px-4 py-2 rounded-full text-sm border transition-all ${formData.emotions.includes(emo)
                                                ? 'bg-solana-purple text-white border-solana-purple'
                                                : 'bg-transparent text-text-muted border-white/10 hover:border-white/30'
                                                }`}
                                        >
                                            {emo}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between mb-4">
                                    <h4 className="text-sm text-text-muted uppercase tracking-wider">Discipline Score</h4>
                                    <span className={`font-bold ${formData.disciplineScore >= 8 ? 'text-green-400' : formData.disciplineScore <= 3 ? 'text-red-400' : 'text-yellow-400'}`}>
                                        {formData.disciplineScore} / 10
                                    </span>
                                </div>
                                <input
                                    type="range" min="1" max="10"
                                    value={formData.disciplineScore || 5} // Prevent NaN
                                    onChange={(e) => setFormData({ ...formData, disciplineScore: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-solana-purple"
                                />
                                <div className="flex justify-between text-xs text-white/30 mt-2">
                                    <span>Complete FOMO</span>
                                    <span>Robot-Like Execution</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ANALYSIS TAB */}
                    {activeTab === 'analysis' && (
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-sm text-text-muted mb-4 uppercase tracking-wider flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                                    Mistakes Made
                                </h4>
                                <div className="flex flex-wrap gap-3">
                                    {MISTAKES.map(err => (
                                        <button
                                            key={err}
                                            onClick={() => toggleSelection('mistakes', err)}
                                            className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${formData.mistakes.includes(err)
                                                ? 'bg-red-500/20 text-red-400 border-red-500/50'
                                                : 'bg-transparent text-text-muted border-white/10 hover:border-white/30'
                                                }`}
                                        >
                                            {err}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm text-text-muted mb-2">Lessons Learned</label>
                                    <textarea
                                        value={formData.lessons}
                                        onChange={(e) => setFormData({ ...formData, lessons: e.target.value })}
                                        className="w-full h-24 bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-solana-purple outline-none resize-none"
                                        placeholder="- Don't trade during lunch&#10;- Wait for candle close"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-text-muted mb-2">Market Context</label>
                                    <textarea
                                        value={formData.marketContext}
                                        onChange={(e) => setFormData({ ...formData, marketContext: e.target.value })}
                                        className="w-full h-24 bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-solana-purple outline-none resize-none"
                                        placeholder="Low volume chop day. CPI data released at 8:30am..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-white/5 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 rounded-lg text-white/60 hover:text-white transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-solana-purple hover:bg-solana-purple-dark text-white rounded-lg font-medium flex items-center gap-2 transition-all shadow-lg hover:shadow-solana-purple/20"
                    >
                        <Save className="w-4 h-4" />
                        Save to Journal
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
