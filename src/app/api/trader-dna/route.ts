import { NextRequest, NextResponse } from 'next/server';
import { analyzeTraderDNA, calculateAlgorithmicDNA } from '@/services/TraderDNAService';
import { getDatabase } from '@/lib/mongodb';
import { ipLimiter } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// Validate Solana wallet address (base58, 32-44 chars)
function isValidWallet(address: string): boolean {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(req: NextRequest) {
    try {
        // Rate limit by IP
        const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        if (!ipLimiter.check(clientIp)) {
            return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
        }

        const body = await req.json();
        const { trades, wallet } = body;

        if (!trades || !Array.isArray(trades)) {
            return NextResponse.json({
                success: false,
                error: 'Trades array required'
            }, { status: 400 });
        }

        // Validate wallet if provided
        if (wallet && !isValidWallet(wallet)) {
            return NextResponse.json({ success: false, error: 'Invalid wallet address' }, { status: 400 });
        }

        // Check cache if wallet provided
        if (wallet) {
            try {
                const db = await getDatabase();
                const cached = await db.collection('trader_dna').findOne({ walletAddress: wallet });

                if (cached?.dna && cached?.cachedAt) {
                    const age = Date.now() - new Date(cached.cachedAt).getTime();
                    if (age < CACHE_TTL_MS) {
                        return NextResponse.json({
                            success: true,
                            dna: cached.dna,
                            source: 'cache'
                        });
                    }
                }
            } catch {
                // MongoDB unavailable, proceed to fresh analysis
            }
        }

        const dna = await analyzeTraderDNA(trades);

        // Cache result server-side if wallet provided (writes are server-controlled,
        // not from client-supplied DNA data — prevents cache poisoning)
        if (wallet && dna) {
            try {
                const db = await getDatabase();
                await db.collection('trader_dna').updateOne(
                    { walletAddress: wallet },
                    {
                        $set: {
                            dna,
                            cachedAt: new Date().toISOString(),
                            tradeCount: trades.length
                        },
                        $setOnInsert: { walletAddress: wallet }
                    },
                    { upsert: true }
                );
            } catch {
                // Cache write failed, non-critical
            }
        }

        return NextResponse.json({ success: true, dna, source: 'fresh' });
    } catch (error: any) {
        console.error('[TraderDNA API] Error:', error);
        return NextResponse.json({
            success: true,
            dna: calculateAlgorithmicDNA([]),
            source: 'fallback'
        });
    }
}
