'use client';

import React from 'react';
import { useTradeData } from '@/hooks/useTradeData';
import { Calendar } from 'lucide-react';

export function DateRangeFilter() {
    const { dateRange, setDateRange } = useTradeData();

    const ranges: { id: 'ALL' | '7D' | '30D' | '90D', label: string }[] = [
        { id: '7D', label: '7D' },
        { id: '30D', label: '30D' },
        { id: '90D', label: '90D' },
        { id: 'ALL', label: 'All' }
    ];

    return (
        <div className="flex items-center gap-2 bg-surface border border-glass-border p-1 rounded-lg">
            <Calendar size={14} className="text-text-muted ml-2 mr-1" />
            {ranges.map(range => (
                <button
                    key={range.id}
                    onClick={() => setDateRange(range.id)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${dateRange === range.id
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-text-muted hover:text-white hover:bg-white/5'
                        }`}
                >
                    {range.label}
                </button>
            ))}
        </div>
    );
}
