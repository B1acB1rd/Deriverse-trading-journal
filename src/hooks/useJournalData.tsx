'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trade } from '../types';

export interface JournalEntry {
    id: string;
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
    const [isLoaded, setIsLoaded] = useState(false);


    useEffect(() => {
        if (!walletAddress) {
            setEntries({});
            setIsLoaded(false);
            return;
        }

        const localKey = `deriverse_journal_${walletAddress}`;


        const saved = localStorage.getItem(localKey);
        if (saved) {
            try {
                setEntries(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse journal entries", e);
            }
        }


        const syncFromMongoDB = async () => {
            try {
                const response = await fetch(`/api/journal?wallet=${walletAddress}`);
                const data = await response.json();

                if (data.success && data.entries && Object.keys(data.entries).length > 0) {
                    // Merge MongoDB entries with localStorage (MongoDB takes priority)
                    setEntries(prev => {
                        const merged = { ...prev, ...data.entries };
                        // Update localStorage with merged data
                        localStorage.setItem(localKey, JSON.stringify(merged));
                        return merged;
                    });
                }
            } catch (error) {
                console.warn('[Journal] MongoDB sync failed, using localStorage only:', error);
            } finally {
                setIsLoaded(true);
            }
        };

        syncFromMongoDB();
    }, [walletAddress]);


    const saveEntry = useCallback((tradeId: string, data: Partial<JournalEntry>) => {
        if (!walletAddress) return;

        const localKey = `deriverse_journal_${walletAddress}`;

        setEntries(prev => {
            const existing = prev[tradeId] || { id: tradeId, updatedAt: new Date().toISOString() };
            const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
            const nextState = { ...prev, [tradeId]: updated };

            // Save to localStorage immediately (instant local backup)
            localStorage.setItem(localKey, JSON.stringify(nextState));

            // Persist to MongoDB with retry
            const persistToMongoDB = async (attempt: number = 1) => {
                try {
                    const response = await fetch('/api/journal', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            wallet: walletAddress,
                            tradeId,
                            entry: updated
                        })
                    });

                    const result = await response.json();

                    if (!result.success) {
                        throw new Error(result.error || 'Save failed');
                    }

                    if (!result.persisted) {
                        console.warn('[Journal] Entry saved locally only — MongoDB not available');
                    }
                } catch (err: any) {
                    console.error(`[Journal] MongoDB save failed (attempt ${attempt}):`, err.message);
                    // Retry once after 2 seconds
                    if (attempt < 2) {
                        setTimeout(() => persistToMongoDB(attempt + 1), 2000);
                    } else {
                        console.error('[Journal] MongoDB save failed after retries. Entry saved in localStorage only.');
                    }
                }
            };

            persistToMongoDB();

            return nextState;
        });
    }, [walletAddress]);


    const hydrateTrades = useCallback((trades: Trade[]): Trade[] => {
        return trades.map(t => {
            const entry = entries[t.id];
            if (!entry) return { ...t, isJournaled: false };

            return {
                ...t,
                strategyId: entry.strategyId,
                manualEntryPrice: entry.manualEntryPrice,
                manualFees: entry.manualFees,
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
        hydrateTrades,
        isLoaded
    };
}

