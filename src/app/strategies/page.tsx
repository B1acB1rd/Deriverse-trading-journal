'use client';

import React from 'react';
import { TraderDNACard } from '@/components/dashboard/TraderDNACard';
import { SetupLibrary } from '@/components/strategies/SetupLibrary';

export default function StrategiesPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">Strategy Playbook</h2>
                    <p className="text-text-muted">Analyze your identity and define your edge.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
                {/* Left Column: Identity */}
                <div className="space-y-6">
                    <div className="h-full">
                        <TraderDNACard />
                    </div>
                </div>

                {/* Right Column: Library */}
                <div className="h-full">
                    <SetupLibrary />
                </div>
            </div>
        </div>
    );
}
