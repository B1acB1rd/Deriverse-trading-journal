'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTradeData } from '../../hooks/useTradeData';

export function PsychologyChart() {
    const { trades } = useTradeData();

    // Aggregate Data
    const emotionStats: Record<string, { wins: number, total: number }> = {};

    trades.forEach(trade => {
        if (!trade.emotions || trade.emotions.length === 0) return;

        trade.emotions.forEach(emo => {
            if (!emotionStats[emo]) emotionStats[emo] = { wins: 0, total: 0 };
            emotionStats[emo].total++;
            if (trade.pnl > 0) emotionStats[emo].wins++;
        });
    });

    const data = Object.keys(emotionStats).map(emo => {
        const stats = emotionStats[emo];
        return {
            name: emo,
            winRate: (stats.wins / stats.total) * 100,
            trades: stats.total
        };
    }).sort((a, b) => b.winRate - a.winRate);

    if (data.length === 0) {
        return (
            <div className="glass-panel p-6 rounded-2xl h-[300px] flex flex-col items-center justify-center text-center">
                <h3 className="text-lg font-bold text-white mb-2">Psychology Analytics</h3>
                <p className="text-sm text-text-muted max-w-xs">
                    No emotional data found. Start tagging your trades in the Journal with emotions (e.g., "Confident", "Anxious") to see your performance breakdown.
                </p>
            </div>
        );
    }

    return (
        <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-6">Performance by Emotional State</h3>
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis dataKey="name" type="category" width={80} tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ backgroundColor: '#0B0C10', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            formatter={(value: any) => [`${(Number(value) || 0).toFixed(1)}%`, 'Win Rate']}
                        />
                        <Bar dataKey="winRate" radius={[0, 4, 4, 0]} barSize={20}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.winRate > 50 ? '#14F195' : '#FF4B4B'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
