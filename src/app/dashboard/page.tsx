import React from 'react';
import { KpiGrid } from '@/components/dashboard/KpiGrid';
import { PnLChart } from '@/components/dashboard/PnLChart';
import { DataIntegrityPanel } from '@/components/dashboard/DataIntegrityPanel';
import { TraderDNACard } from '@/components/dashboard/TraderDNACard';
import { ProjectionsCard } from '@/components/dashboard/ProjectionsCard';
import { TradeJournal } from '@/components/dashboard/TradeJournal'; // This will serve as Recent Activity
import { AssetsOverview } from '@/components/dashboard/AssetsOverview';
import { PendingOrdersWidget } from '@/components/dashboard/PendingOrdersWidget';
import { DateRangeFilter } from '@/components/common/DateRangeFilter';

export default function DashboardPage() {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Command Center</h2>
          <p className="text-text-muted">Real-time market tracking and performance analytics.</p>
        </div>
        <DateRangeFilter />
      </div>

      {/* Row 1: Assets & Pending Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AssetsOverview />
        </div>
        <div className="lg:col-span-1">
          <PendingOrdersWidget />
        </div>
      </div>

      {/* Row 2: KPIs */}
      <KpiGrid />

      {/* Row 3: Charts & Projections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-1 rounded-2xl">
            <PnLChart />
          </div>
        </div>
        <div className="space-y-6">
          <ProjectionsCard />
          <DataIntegrityPanel />
        </div>
      </div>

      {/* Row 4: Recent Activity & DNA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <TradeJournal />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Trader DNA</h3>
          <div className="h-[350px]">
            <TraderDNACard />
          </div>
        </div>
      </div>
    </div>
  );
}
