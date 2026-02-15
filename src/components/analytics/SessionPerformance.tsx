'use client';

import React from 'react';
import { useTradeData } from '@/hooks/useTradeData';
import { calculateSessionMetrics } from '@/lib/metrics';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';

export function SessionPerformance() {
  const { trades } = useTradeData();

  const data = React.useMemo(() => {
    if (!trades || trades.length === 0) return [];

    return calculateSessionMetrics(trades).map((s) => ({
      name: s.session,
      PnL: s.pnl,
      Trades: s.tradeCount,
      WinRate: s.winRate,
    }));
  }, [trades]);

  if (data.length === 0 || data.every((d) => d.Trades === 0)) {
    return (
      <div className="glass-panel p-6 rounded-xl h-[400px]">
        <h3 className="text-lg font-bold text-text-primary mb-2">
          Session Performance
        </h3>
        <p className="text-xs text-text-muted">No trade data available</p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-xl h-[400px] flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-text-primary">
          Session Performance
        </h3>
        <p className="text-xs text-text-muted">
          Asian (00-08 UTC) · European (08-16) · American (16-24)
        </p>
      </div>

      <div className="flex-1 w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--glass-border)"
              vertical={false}
            />

            <XAxis
              dataKey="name"
              stroke="var(--color-text-muted)"
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              stroke="var(--color-text-muted)"
              tickFormatter={(val) => `$${val}`}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--glass-border)',
                borderRadius: '8px',
              }}
              formatter={(value: any, name?: string) => {
                const safeName = name ?? '';

                if (safeName === 'PnL') {
                  return [formatCurrency(Number(value) || 0), 'PnL'];
                }

                return [value, safeName];
              }}
            />

            <Bar dataKey="PnL" name="PnL" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.PnL >= 0
                      ? 'var(--color-success)'
                      : 'var(--color-danger)'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-glass-border grid grid-cols-3 gap-3 text-xs">
        {data.map((s) => (
          <div key={s.name} className="flex flex-col items-center">
            <span className="text-text-muted">{s.name}</span>
            <span className="text-white font-mono">
              {s.WinRate.toFixed(1)}% WR
            </span>
            <span className="text-text-muted">{s.Trades} trades</span>
          </div>
        ))}
      </div>
    </div>
  );
}