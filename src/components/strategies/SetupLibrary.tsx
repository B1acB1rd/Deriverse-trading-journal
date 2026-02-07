'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Target } from 'lucide-react';

interface Setup {
    id: string;
    name: string;
    description: string;
    tags: string[];
}

const DEFAULT_SETUPS: Setup[] = [
    { id: '1', name: 'Bull Flag', description: 'Continuation pattern after a strong impulse move.', tags: ['Trend', 'Continuation'] },
    { id: '2', name: 'Key Level Reversal', description: 'Rejection from higher timeframe support/resistance.', tags: ['Reversal', 'Mean Reversion'] },
];

export function SetupLibrary() {
    const [setups, setSetups] = useState<Setup[]>(DEFAULT_SETUPS); // In real app, persist this
    const [isAdding, setIsAdding] = useState(false);
    const [newSetup, setNewSetup] = useState({ name: '', description: '' });

    const handleAdd = () => {
        if (!newSetup.name) return;
        setSetups([...setups, {
            id: Date.now().toString(),
            name: newSetup.name,
            description: newSetup.description,
            tags: ['Custom']
        }]);
        setNewSetup({ name: '', description: '' });
        setIsAdding(false);
    };

    return (
        <div className="glass-panel p-6 rounded-2xl h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Target className="w-5 h-5 text-solana-purple" />
                        Setup Library
                    </h3>
                    <p className="text-sm text-text-muted">Define your edge. Tag your trades with these setups.</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-4">
                {isAdding && (
                    <div className="p-4 bg-white/5 rounded-xl border border-solana-purple/50 animate-fade-in">
                        <input
                            type="text"
                            placeholder="Setup Name (e.g. Breakout)"
                            value={newSetup.name}
                            onChange={(e) => setNewSetup({ ...newSetup, name: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white mb-2 focus:border-solana-purple outline-none"
                        />
                        <textarea
                            placeholder="Description / Rules"
                            value={newSetup.description}
                            onChange={(e) => setNewSetup({ ...newSetup, description: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white mb-3 focus:border-solana-purple outline-none resize-none h-20"
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsAdding(false)} className="text-xs text-white/40 hover:text-white px-3 py-1">Cancel</button>
                            <button onClick={handleAdd} className="text-xs bg-solana-purple text-white px-3 py-1 rounded hover:bg-solana-purple-dark">Add Setup</button>
                        </div>
                    </div>
                )}

                {setups.map(setup => (
                    <div key={setup.id} className="group p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-white text-sm">{setup.name}</h4>
                                <p className="text-xs text-text-muted mt-1">{setup.description}</p>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1.5 hover:bg-white/10 rounded text-white/40 hover:text-white">
                                    <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => setSetups(prev => prev.filter(s => s.id !== setup.id))}
                                    className="p-1.5 hover:bg-red-500/20 rounded text-white/40 hover:text-red-400"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                            {setup.tags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 bg-black/20 rounded text-[10px] text-white/40 border border-white/5">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
