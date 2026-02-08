import { NextRequest, NextResponse } from 'next/server';
import { analyzeTraderDNA, calculateAlgorithmicDNA } from '@/services/TraderDNAService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { trades } = body;

        if (!trades || !Array.isArray(trades)) {
            return NextResponse.json({
                success: false,
                error: 'Trades array required'
            }, { status: 400 });
        }

        // Analyze trader DNA using Gemini AI (or fallback)
        const dna = await analyzeTraderDNA(trades);

        return NextResponse.json({
            success: true,
            dna
        });
    } catch (error: any) {
        console.error('[TraderDNA API] Error:', error);

        // Return fallback on error
        return NextResponse.json({
            success: true,
            dna: calculateAlgorithmicDNA([]),
            error: 'AI analysis unavailable, using fallback'
        });
    }
}
