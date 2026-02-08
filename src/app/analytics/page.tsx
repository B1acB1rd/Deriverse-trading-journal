import React from 'react';
import { PnLAttributionChart } from '@/components/analytics/PnLAttributionChart';
import { PsychologyChart } from '@/components/analytics/PsychologyChart';
import { OrderTypePerformance } from '@/components/analytics/OrderTypePerformance';
import { DrawdownChart } from '@/components/analytics/DrawdownChart';
import { DateRangeFilter } from '@/components/common/DateRangeFilter';

export default function AnalyticsPage() {
    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">Advanced Analytics</h2>
                    <p className="text-text-muted">Deep dive into your performance drivers.</p>
                </div>
                <DateRangeFilter />
            </div>

            {/* Top Row: PnL Attribution & Psychology */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PnLAttributionChart />
                <PsychologyChart />
            </div>

            {/* Bottom Row: Order Performance & Drawdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <OrderTypePerformance />
                <DrawdownChart />
            </div>
        </div>
    );
}
