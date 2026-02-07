'use client';

import React from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/lib/utils';

export function LiquidityHeatmap() {


    // Heatmap requires Order Book L2 data which is not yet available via simple RPC.
    // For now, we return empty if no specific L2 source is connected. 
    // This adheres to "No Mock Data" policy.
    const data: any[] = [];
    // const now = new Date().getTime(); // Removed mock generation loop

    if (data.length === 0) {
        return (
            <div className="glass-panel p-6 rounded-xl h-[200px] flex items-center justify-center text-text-muted border border-glass-border">
                <p>Liquidity Heatmap requires active Deriverse Market Data feed.</p>
            </div>
        );
    }

    return (
        <div className="glass-panel p-6 rounded-xl h-[450px] w-full">
            <div className="mb-4 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-text-primary">On-Chain Liquidity Map</h3>
                    <p className="text-xs text-text-muted">Visualizing order book depth over time (SOL-PERP)</p>
                </div>
                <div className="text-xs text-text-secondary bg-surface px-2 py-1 rounded border border-glass-border">
                    Heat = Resting Limit Orders
                </div>
            </div>

            <div className="w-full h-[350px] min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                        <XAxis
                            dataKey="x"
                            type="number"
                            domain={['auto', 'auto']}
                            name="Time"
                            tickFormatter={(unixTime: number) => new Date(unixTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            stroke="var(--color-text-muted)"
                            tick={{ fontSize: 10 }}
                        />
                        <YAxis
                            dataKey="y"
                            type="number"
                            name="Price"
                            unit="$"
                            domain={['auto', 'auto']}
                            stroke="var(--color-text-muted)"
                            tick={{ fontSize: 12 }}
                        />
                        <ZAxis type="number" dataKey="z" range={[10, 400]} name="Liquidity" />
                        <Tooltip
                            cursor={{ strokeDasharray: '3 3' }}
                            content={(props: any) => {
                                const { active, payload } = props;
                                if (active && payload && payload.length) {
                                    const d = payload[0].payload;
                                    return (
                                        <div className="bg-surface border border-glass-border p-2 rounded shadow-xl text-xs">
                                            <p className="text-text-muted">{new Date(d.x).toLocaleTimeString()}</p>
                                            <p className="text-text-primary font-bold">Price: ${d.y}</p>
                                            <p className="text-accent">Depth: {formatCurrency(d.z)}</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Scatter data={data} shape="square">
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={`rgba(6, 182, 212, ${entry.z / 1200})`} // Dynamic Opacity based on Depth
                                    stroke="none"
                                />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
