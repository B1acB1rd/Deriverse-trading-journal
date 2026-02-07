'use client';

import React from 'react';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';

export default function CalendarPage() {
    return (
        <div className="animate-fade-in">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-text-primary">Performance Calendar</h2>
                <p className="text-text-muted">A bird's-eye view of your trading consistency and daily PnL.</p>
            </div>

            <div className="mb-8">
                <CalendarGrid />
            </div>
        </div>
    );
}
