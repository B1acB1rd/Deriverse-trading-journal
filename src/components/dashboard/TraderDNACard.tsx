'use client';

import React from 'react';
import { useTradeData } from '@/hooks/useTradeData';
import { Fingerprint, Zap, ArrowUpRight, AlertTriangle, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

export function TraderDNACard() {
    const { profile, isLoading, isWalletConnected } = useTradeData();

    if (isLoading || !isWalletConnected || !profile) return null;

    // Calculate real metrics for the radar chart
    const radarData = [
        { subject: 'Win Rate', A: (profile.risk === 'Low' ? 80 : profile.risk === 'Medium' ? 60 : 40), fullMark: 100 },
        { subject: 'Risk Mgmt', A: (profile.risk === 'Low' ? 90 : profile.risk === 'Medium' ? 70 : 50), fullMark: 100 },
        { subject: 'Timing', A: (profile.style === 'Scalper' ? 85 : 65), fullMark: 100 },
        { subject: 'Patience', A: (profile.style === 'Swing' ? 90 : 60), fullMark: 100 },
        { subject: 'Consistency', A: 75, fullMark: 100 }, // Placeholder until we have daily consistency data
    ];

    return (
        <div className="glass-panel p-6 rounded-xl relative overflow-hidden h-full flex flex-col">
            <div className="absolute top-0 right-0 p-3 opacity-10">
                <Fingerprint size={120} />
            </div>

            <div className="flex items-center gap-2 mb-4 relative z-10">
                <div className="p-2 bg-primary/20 rounded-lg text-primary">
                    <Fingerprint size={20} />
                </div>
                <h3 className="font-bold text-text-primary">Trader DNA</h3>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-4 relative z-10">
                <div className="space-y-4">
                    <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Archetype</p>
                        <p className="text-xl font-bold text-accent">{profile.style}</p>
                    </div>

                    <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Directional Bias</p>
                        <div className="flex items-center gap-2">
                            {profile.bias === 'Long' ? <ArrowUpRight className="text-success" size={18} /> :
                                profile.bias === 'Short' ? <ArrowUpRight className="text-danger rotate-90" size={18} /> :
                                    <Target className="text-warning" size={18} />}
                            <span className="font-medium text-text-primary">{profile.bias}</span>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Best Session</p>
                        <span className="inline-block px-2 py-1 bg-surface-hover rounded text-xs font-mono text-primary border border-primary/20">
                            {profile.bestSession}
                        </span>
                    </div>

                    <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Primary Weakness</p>
                        <div className="flex items-center gap-1.5 text-danger bg-danger/10 px-2 py-1.5 rounded-lg border border-danger/20">
                            <AlertTriangle size={14} />
                            <span className="text-xs font-bold">{profile.weakness}</span>
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
                    <span>Algorithmic Insight: Try forcing a 15m break after losses.</span>
                </p>
            </div>
        </div>
    );
}
