'use client';

import React, { useEffect, useState } from 'react';
import { useTradeData } from '@/hooks/useTradeData';
import { Fingerprint, Zap, ArrowUpRight, AlertTriangle, Target, Brain, Cpu } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

interface TraderDNA {
    archetype: string;
    directionalBias: string;
    bestSession: string;
    primaryWeakness: string;
    scores: {
        winRate: number;
        riskManagement: number;
        timing: number;
        patience: number;
        consistency: number;
    };
    insight: string;
    source: 'ai' | 'algorithmic';
}

export function TraderDNACard() {
    const { trades, isLoading, isWalletConnected } = useTradeData();
    const [dna, setDna] = useState<TraderDNA | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Fetch Trader DNA analysis when trades change
    useEffect(() => {
        if (!isWalletConnected || !trades || trades.length === 0) {
            setDna(null);
            return;
        }

        const analyzeDNA = async () => {
            setIsAnalyzing(true);
            try {
                const response = await fetch('/api/trader-dna', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ trades }),
                });
                const data = await response.json();
                if (data.success && data.dna) {
                    setDna(data.dna);
                }
            } catch (error) {
                console.error('[TraderDNA] Analysis failed:', error);
            } finally {
                setIsAnalyzing(false);
            }
        };

        // Debounce to avoid excessive API calls
        const debounceTimer = setTimeout(analyzeDNA, 500);
        return () => clearTimeout(debounceTimer);
    }, [trades, isWalletConnected]);

    if (isLoading || !isWalletConnected) return null;

    // Show loading state while analyzing
    if (isAnalyzing || !dna) {
        return (
            <div className="glass-panel p-6 rounded-xl relative overflow-hidden h-full flex flex-col items-center justify-center">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Fingerprint size={120} />
                </div>
                <div className="animate-pulse flex flex-col items-center gap-3">
                    <Brain className="w-8 h-8 text-primary animate-bounce" />
                    <p className="text-text-muted text-sm">Analyzing trading patterns...</p>
                </div>
            </div>
        );
    }

    // Build radar chart data from real scores
    const radarData = [
        { subject: 'Win Rate', A: dna.scores.winRate, fullMark: 100 },
        { subject: 'Risk Mgmt', A: dna.scores.riskManagement, fullMark: 100 },
        { subject: 'Timing', A: dna.scores.timing, fullMark: 100 },
        { subject: 'Patience', A: dna.scores.patience, fullMark: 100 },
        { subject: 'Consistency', A: dna.scores.consistency, fullMark: 100 },
    ];

    return (
        <div className="glass-panel p-6 rounded-xl relative overflow-hidden h-full flex flex-col">
            <div className="absolute top-0 right-0 p-3 opacity-10">
                <Fingerprint size={120} />
            </div>

            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/20 rounded-lg text-primary">
                        <Fingerprint size={20} />
                    </div>
                    <h3 className="font-bold text-text-primary">Trader DNA</h3>
                </div>
                {/* Source indicator */}
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${dna.source === 'ai' ? 'bg-solana-purple/20 text-solana-purple' : 'bg-gray-500/20 text-gray-400'}`}>
                    {dna.source === 'ai' ? <Brain size={12} /> : <Cpu size={12} />}
                    <span>{dna.source === 'ai' ? 'AI Analysis' : 'Algorithmic'}</span>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-4 relative z-10">
                <div className="space-y-4">
                    <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Archetype</p>
                        <p className="text-xl font-bold text-accent">{dna.archetype}</p>
                    </div>

                    <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Directional Bias</p>
                        <div className="flex items-center gap-2">
                            {dna.directionalBias.includes('Long') ? <ArrowUpRight className="text-success" size={18} /> :
                                dna.directionalBias.includes('Short') ? <ArrowUpRight className="text-danger rotate-90" size={18} /> :
                                    <Target className="text-warning" size={18} />}
                            <span className="font-medium text-text-primary">{dna.directionalBias}</span>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Best Session</p>
                        <span className="inline-block px-2 py-1 bg-surface-hover rounded text-xs font-mono text-primary border border-primary/20">
                            {dna.bestSession}
                        </span>
                    </div>

                    <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Primary Weakness</p>
                        <div className="flex items-center gap-1.5 text-danger bg-danger/10 px-2 py-1.5 rounded-lg border border-danger/20">
                            <AlertTriangle size={14} />
                            <span className="text-xs font-bold">{dna.primaryWeakness}</span>
                        </div>
                    </div>
                </div>

                <div className="h-full min-h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid stroke="var(--glass-border)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: 'var(--color-text-secondary)' }} />
                            <Radar
                                name="Skill"
                                dataKey="A"
                                stroke="var(--color-accent)"
                                strokeWidth={2}
                                fill="var(--color-accent)"
                                fillOpacity={0.3}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-glass-border">
                <p className="text-xs text-text-muted italic flex items-center gap-2">
                    <Zap size={12} className="text-warning" />
                    <span>{dna.insight}</span>
                </p>
            </div>
        </div>
    );
}

