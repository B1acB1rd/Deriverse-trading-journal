import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// Journal Entry interface matching the frontend
interface JournalEntryDocument {
    walletAddress: string;
    tradeId: string;
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
    createdAt: Date;
    updatedAt: Date;
}

/**
 * GET - Retrieve all journal entries for a wallet
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
        return NextResponse.json({ success: false, error: 'Wallet address required' }, { status: 400 });
    }

    // Check if MongoDB is configured
    if (!process.env.MONGODB_URI) {
        return NextResponse.json({ success: true, entries: {}, source: 'none' });
    }

    try {
        const db = await getDatabase();
        const collection = db.collection<JournalEntryDocument>('journal_entries');

        const entries = await collection.find({ walletAddress: wallet }).toArray();

        // Convert to Record format for frontend compatibility
        const entriesMap: Record<string, any> = {};
        for (const entry of entries) {
            entriesMap[entry.tradeId] = {
                id: entry.tradeId,
                strategyId: entry.strategyId,
                manualEntryPrice: entry.manualEntryPrice,
                manualFees: entry.manualFees,
                notes: entry.notes,
                emotions: entry.emotions,
                disciplineScore: entry.disciplineScore,
                mistakes: entry.mistakes,
                lessons: entry.lessons,
                marketContext: entry.marketContext,
                screenshots: entry.screenshots,
                riskRewardRatio: entry.riskRewardRatio,
                updatedAt: entry.updatedAt?.toISOString()
            };
        }

        return NextResponse.json({ success: true, entries: entriesMap, source: 'mongodb' });
    } catch (error: any) {
        console.warn('[Journal API] MongoDB unavailable, falling back to localStorage-only mode:', error.message);
        // Gracefully degrade — return empty so the frontend uses localStorage
        return NextResponse.json({ success: true, entries: {}, source: 'none' });
    }
}

/**
 * POST - Save a journal entry
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { wallet, tradeId, entry } = body;

        if (!wallet || !tradeId) {
            return NextResponse.json({ success: false, error: 'wallet and tradeId required' }, { status: 400 });
        }

        // Check if MongoDB is configured
        if (!process.env.MONGODB_URI) {
            // Return success but indicate no persistence
            return NextResponse.json({ success: true, persisted: false, source: 'none' });
        }

        const db = await getDatabase();
        const collection = db.collection<JournalEntryDocument>('journal_entries');

        const doc: JournalEntryDocument = {
            walletAddress: wallet,
            tradeId,
            strategyId: entry.strategyId,
            manualEntryPrice: entry.manualEntryPrice,
            manualFees: entry.manualFees,
            notes: entry.notes,
            emotions: entry.emotions,
            disciplineScore: entry.disciplineScore,
            mistakes: entry.mistakes,
            lessons: entry.lessons,
            marketContext: entry.marketContext,
            screenshots: entry.screenshots,
            riskRewardRatio: entry.riskRewardRatio,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Upsert (insert or update)
        await collection.updateOne(
            { walletAddress: wallet, tradeId },
            {
                $set: doc,
                $setOnInsert: { createdAt: new Date() }
            },
            { upsert: true }
        );

        console.log(`[Journal] Saved entry for trade ${tradeId.slice(0, 20)}...`);
        return NextResponse.json({ success: true, persisted: true, source: 'mongodb' });
    } catch (error: any) {
        console.warn('[Journal API] MongoDB save failed, localStorage will be used:', error.message);
        // Gracefully degrade — entry is still saved in localStorage on the client
        return NextResponse.json({ success: true, persisted: false, source: 'none' });
    }
}
