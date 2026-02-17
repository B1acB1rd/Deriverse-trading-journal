import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ipLimiter } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// Validate Solana wallet address (base58, 32-44 chars)
function isValidWallet(address: string): boolean {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

export async function GET(req: NextRequest) {
    const wallet = req.nextUrl.searchParams.get('wallet');
    if (!wallet || !isValidWallet(wallet)) {
        return NextResponse.json({ success: false, error: 'Valid wallet address required' }, { status: 400 });
    }

    try {
        const db = await getDatabase();
        const doc = await db.collection('strategies').findOne({ walletAddress: wallet });
        const strategies = doc?.strategies || [];
        return NextResponse.json({ success: true, strategies, source: 'mongodb' });
    } catch (error: any) {
        console.warn('[Strategies API] MongoDB unavailable:', error.message);
        return NextResponse.json({ success: true, strategies: [], source: 'none' });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { wallet, strategy } = await req.json();
        if (!wallet || !strategy) {
            return NextResponse.json({ success: false, error: 'Wallet and strategy required' }, { status: 400 });
        }
        if (!isValidWallet(wallet)) {
            return NextResponse.json({ success: false, error: 'Invalid wallet address' }, { status: 400 });
        }

        // Rate limit by IP
        const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        if (!ipLimiter.check(clientIp)) {
            return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
        }

        const db = await getDatabase();
        await db.collection('strategies').updateOne(
            { walletAddress: wallet },
            {
                $push: { strategies: strategy } as any,
                $set: { updatedAt: new Date().toISOString() },
                $setOnInsert: { walletAddress: wallet, createdAt: new Date().toISOString() }
            },
            { upsert: true }
        );

        return NextResponse.json({ success: true, persisted: true });
    } catch (error: any) {
        console.warn('[Strategies API] MongoDB save failed:', error.message);
        return NextResponse.json({ success: true, persisted: false, source: 'none' });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { wallet, strategyId } = await req.json();
        if (!wallet || !strategyId) {
            return NextResponse.json({ success: false, error: 'Wallet and strategyId required' }, { status: 400 });
        }
        if (!isValidWallet(wallet)) {
            return NextResponse.json({ success: false, error: 'Invalid wallet address' }, { status: 400 });
        }

        // Rate limit by IP
        const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        if (!ipLimiter.check(clientIp)) {
            return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
        }

        const db = await getDatabase();
        await db.collection('strategies').updateOne(
            { walletAddress: wallet },
            { $pull: { strategies: { id: strategyId } } as any }
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.warn('[Strategies API] MongoDB delete failed:', error.message);
        return NextResponse.json({ success: true, persisted: false });
    }
}

