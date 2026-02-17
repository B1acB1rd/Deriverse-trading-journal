import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ipLimiter } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';


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

    // Security: validate wallet is a real Solana address
    if (!isValidWallet(wallet)) {
        return NextResponse.json({ success: false, error: 'Invalid wallet address' }, { status: 400 });
    }


    if (!process.env.MONGODB_URI) {
        return NextResponse.json({ success: true, entries: {}, source: 'none' });
    }

    try {
        const db = await getDatabase();
        const collection = db.collection<JournalEntryDocument>('journal_entries');

        const entries = await collection.find({ walletAddress: wallet }).toArray();


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

        return NextResponse.json({ success: true, entries: {}, source: 'none' });
    }
}

/**
 * POST - Save a journal entry
 */
// Validate Solana wallet address (base58, 32-44 chars)
function isValidWallet(address: string): boolean {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

// Sanitize string input (trim, limit length)
function sanitizeStr(val: any, maxLen: number = 2000): string | undefined {
    if (typeof val !== 'string') return undefined;
    return val.trim().slice(0, maxLen) || undefined;
}

// Sanitize string array
function sanitizeStrArr(val: any, maxItems: number = 20, maxLen: number = 500): string[] | undefined {
    if (!Array.isArray(val)) return undefined;
    return val
        .filter((v: any) => typeof v === 'string')
        .slice(0, maxItems)
        .map((v: string) => v.trim().slice(0, maxLen));
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { wallet, tradeId, entry } = body;

        if (!wallet || !tradeId) {
            return NextResponse.json({ success: false, error: 'wallet and tradeId required' }, { status: 400 });
        }

        // Security: validate wallet is a real Solana address
        if (!isValidWallet(wallet)) {
            return NextResponse.json({ success: false, error: 'Invalid wallet address' }, { status: 400 });
        }

        // Rate limit by IP
        const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        if (!ipLimiter.check(clientIp)) {
            return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
        }

        // TODO: Production auth — require wallet ownership proof (signed message)
        // before allowing journal writes. Currently any caller can write to any wallet.

        // Security: validate tradeId length
        if (typeof tradeId !== 'string' || tradeId.length > 200) {
            return NextResponse.json({ success: false, error: 'Invalid tradeId' }, { status: 400 });
        }

        if (!process.env.MONGODB_URI) {
            return NextResponse.json({ success: true, persisted: false, source: 'none' });
        }

        const db = await getDatabase();
        const collection = db.collection<JournalEntryDocument>('journal_entries');

        // Sanitize all user input
        const updateData = {
            walletAddress: wallet,
            tradeId,
            strategyId: sanitizeStr(entry?.strategyId, 100),
            manualEntryPrice: typeof entry?.manualEntryPrice === 'number' ? entry.manualEntryPrice : undefined,
            manualFees: typeof entry?.manualFees === 'number' ? entry.manualFees : undefined,
            notes: sanitizeStr(entry?.notes, 5000),
            emotions: sanitizeStrArr(entry?.emotions, 10, 50),
            disciplineScore: typeof entry?.disciplineScore === 'number'
                ? Math.max(0, Math.min(10, entry.disciplineScore)) : undefined,
            mistakes: sanitizeStrArr(entry?.mistakes, 10, 500),
            lessons: sanitizeStrArr(entry?.lessons, 10, 500),
            marketContext: sanitizeStr(entry?.marketContext, 2000),
            screenshots: sanitizeStrArr(entry?.screenshots, 10, 500),
            riskRewardRatio: typeof entry?.riskRewardRatio === 'number' ? entry.riskRewardRatio : undefined,
            updatedAt: new Date()
        };

        await collection.updateOne(
            { walletAddress: wallet, tradeId },
            {
                $set: updateData,
                $setOnInsert: { createdAt: new Date() }
            },
            { upsert: true }
        );

        console.log(`[Journal] Saved entry for trade ${tradeId.slice(0, 20)}...`);
        return NextResponse.json({ success: true, persisted: true, source: 'mongodb' });
    } catch (error: any) {
        console.warn('[Journal API] MongoDB save failed, localStorage will be used:', error.message);
        return NextResponse.json({ success: true, persisted: false, source: 'none' });
    }
}
