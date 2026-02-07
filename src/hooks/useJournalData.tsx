'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trade } from '../types';

export interface JournalEntry {
    id: string; // Counts as the Transaction Signature
    strategyId?: string;
    manualEntryPrice?: number;
    manualFees?: number;
    notes?: string;
    emotions?: string[];
    disciplineScore?: number;
    mistakes?: string[];
    lessons?: string[];
    marketContext?: string;
    screenshots?: string[];
    riskRewardRatio?: number;
    updatedAt: string;
}

export function useJournalData(walletAddress: string | null) {
    const [entries, setEntries] = useState<Record<string, JournalEntry>>({});

    // Load from LocalStorage on mount or wallet change
    useEffect(() => {
        if (!walletAddress) {
            setEntries({});
            return;
        }

        const key = `deriverse_journal_${walletAddress}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                setEntries(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse journal entries", e);
            }
        } else {
            setEntries({});
        }
    }, [walletAddress]);

    // Save entry
    const saveEntry = useCallback((tradeId: string, data: Partial<JournalEntry>) => {
        if (!walletAddress) return;

        setEntries(prev => {
            const existing = prev[tradeId] || { id: tradeId, updatedAt: new Date().toISOString() };
            const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };

            const nextState = { ...prev, [tradeId]: updated };

            // Persist to LocalStorage
            const key = `deriverse_journal_${walletAddress}`;
            localStorage.setItem(key, JSON.stringify(nextState));

            return nextState;
        });
    }, [walletAddress]);

    // Hydrate helper: Merges on-chain trade with local journal data
    const hydrateTrades = useCallback((trades: Trade[]): Trade[] => {
        return trades.map(t => {
            const entry = entries[t.id];
            if (!entry) return { ...t, isJournaled: false };

            return {
                ...t,
                strategyId: entry.strategyId,
                manualEntryPrice: entry.manualEntryPrice,
                manualFees: entry.manualFees,
                price: entry.manualEntryPrice !== undefined ? entry.manualEntryPrice : t.price, // Should this be entry override? No, t.price is usually exit price for closed trades. Let's keep distinct.
                // Wait, if we want the UI to use it, we should fallback or simply pass it through.
                // Let's pass it through and let the UI decide what to display.
                // Actually, for PnL calcs, we might want to override.
                // But t.price is the MARK price or EXECUTION price of the transaction.
                // Let's just attach the props.
                emotions: entry.emotions,
                disciplineScore: entry.disciplineScore,
                mistakes: entry.mistakes,
                lessons: entry.lessons,
                marketContext: entry.marketContext,
                screenshots: entry.screenshots,
                riskRewardRatio: entry.riskRewardRatio,
                notes: entry.notes,
                isJournaled: true
            };
        });
    }, [entries]);

    return {
        entries,
        saveEntry,
        hydrateTrades
    };
}
