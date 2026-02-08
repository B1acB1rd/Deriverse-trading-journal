import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI client
const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

export interface TraderDNAResult {
    archetype: string;
    directionalBias: string;
    bestSession: string;
    primaryWeakness: string;
    scores: {
        winRate: number;
        riskManagement: number;
        timing: number;
        patience: number;
        consistency: number;
    };
    insight: string;
    source: 'ai' | 'algorithmic';
}

/**
 * Analyze trader DNA using Gemini AI
 */
export async function analyzeTraderDNA(trades: any[]): Promise<TraderDNAResult> {
    // If no Gemini API key or AI fails, use algorithmic fallback
    if (!genAI) {
        console.log('[TraderDNA] No Gemini API key, using algorithmic analysis');
        return calculateAlgorithmicDNA(trades);
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Prepare trade summary for AI
        const tradeSummary = summarizeTradesForAI(trades);

        const prompt = `You are an expert trading psychologist. Analyze this trader's performance data and provide insights.

TRADING DATA:
${tradeSummary}

Based on this data, provide a JSON response (no markdown, just valid JSON) with:
{
    "archetype": "one of: Scalper, Swing Trader, Position Trader, Day Trader, Momentum Trader, Contrarian",
    "directionalBias": "one of: Long Biased, Short Biased, Balanced",
    "bestSession": "one of: Asia (01-09 UTC), London (07-15 UTC), NY (13-22 UTC)",
    "primaryWeakness": "a short phrase describing their main weakness",
    "scores": {
        "winRate": 0-100,
        "riskManagement": 0-100,
        "timing": 0-100,
        "patience": 0-100,
        "consistency": 0-100
    },
    "insight": "A brief, actionable trading tip based on their data (max 15 words)"
}

Respond ONLY with the JSON, no explanation.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse AI response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                ...parsed,
                source: 'ai' as const
            };
        }

        throw new Error('Failed to parse AI response');
    } catch (error) {
        console.warn('[TraderDNA] AI analysis failed, using fallback:', error);
        return calculateAlgorithmicDNA(trades);
    }
}

/**
 * Algorithmic fallback when AI is unavailable
 */
export function calculateAlgorithmicDNA(trades: any[]): TraderDNAResult {
    if (trades.length === 0) {
        return getDefaultDNA();
    }

    // Calculate basic metrics
    const wins = trades.filter(t => (t.pnl || 0) > 0).length;
    const losses = trades.filter(t => (t.pnl || 0) < 0).length;
    const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 50;

    const longs = trades.filter(t => t.side === 'LONG').length;
    const shorts = trades.filter(t => t.side === 'SHORT').length;
    const longRatio = trades.length > 0 ? longs / trades.length : 0.5;

    // Determine archetype based on trade frequency
    const avgDurationMs = trades.length > 1
        ? (new Date(trades[0].timestamp).getTime() - new Date(trades[trades.length - 1].timestamp).getTime()) / trades.length
        : 0;
    const avgDurationHours = avgDurationMs / (1000 * 60 * 60);

    let archetype = 'Day Trader';
    if (avgDurationHours < 1) archetype = 'Scalper';
    else if (avgDurationHours > 24) archetype = 'Swing Trader';
    else if (avgDurationHours > 72) archetype = 'Position Trader';

    // Directional bias
    let directionalBias = 'Balanced';
    if (longRatio > 0.65) directionalBias = 'Long Biased';
    else if (longRatio < 0.35) directionalBias = 'Short Biased';

    // Best session (based on profitable trades)
    const profitBySession = { asia: 0, london: 0, ny: 0 };
    trades.forEach(t => {
        const hour = new Date(t.timestamp).getUTCHours();
        const pnl = t.pnl || 0;
        if (hour >= 1 && hour < 9) profitBySession.asia += pnl;
        else if (hour >= 7 && hour < 15) profitBySession.london += pnl;
        else profitBySession.ny += pnl;
    });

    let bestSession = 'NY (13-22 UTC)';
    if (profitBySession.asia > profitBySession.london && profitBySession.asia > profitBySession.ny) {
        bestSession = 'Asia (01-09 UTC)';
    } else if (profitBySession.london > profitBySession.ny) {
        bestSession = 'London (07-15 UTC)';
    }

    // Calculate scores
    const riskManagement = Math.min(100, Math.max(0, 50 + (wins - losses) * 5));
    const timing = Math.min(100, Math.max(0, winRate));
    const patience = Math.min(100, Math.max(0, 100 - (trades.length / 10) * 10));
    const consistency = Math.min(100, Math.max(0, 50 + (winRate - 50)));

    // Primary weakness
    let primaryWeakness = 'Needs more data';
    if (winRate < 40) primaryWeakness = 'Poor Entry Timing (Low Win Rate)';
    else if (losses > wins * 2) primaryWeakness = 'Letting Losses Run';
    else if (patience < 30) primaryWeakness = 'Overtrading';
    else if (riskManagement < 40) primaryWeakness = 'Poor Risk Management';

    // Insight
    let insight = 'Focus on your best session times.';
    if (winRate < 40) insight = 'Try forcing a 15m break after losses.';
    else if (patience < 30) insight = 'Quality over quantity - wait for A+ setups.';

    return {
        archetype,
        directionalBias,
        bestSession,
        primaryWeakness,
        scores: {
            winRate: Math.round(winRate),
            riskManagement: Math.round(riskManagement),
            timing: Math.round(timing),
            patience: Math.round(patience),
            consistency: Math.round(consistency)
        },
        insight,
        source: 'algorithmic'
    };
}

function getDefaultDNA(): TraderDNAResult {
    return {
        archetype: 'New Trader',
        directionalBias: 'Balanced',
        bestSession: 'NY (13-22 UTC)',
        primaryWeakness: 'Insufficient data',
        scores: {
            winRate: 50,
            riskManagement: 50,
            timing: 50,
            patience: 50,
            consistency: 50
        },
        insight: 'Complete more trades for personalized insights.',
        source: 'algorithmic'
    };
}

function summarizeTradesForAI(trades: any[]): string {
    if (trades.length === 0) return 'No trades yet.';

    const wins = trades.filter(t => (t.pnl || 0) > 0).length;
    const losses = trades.filter(t => (t.pnl || 0) < 0).length;
    const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const longs = trades.filter(t => t.side === 'LONG').length;
    const shorts = trades.filter(t => t.side === 'SHORT').length;

    const spotTrades = trades.filter(t => t.symbol?.includes('USDC')).length;
    const perpTrades = trades.filter(t => t.symbol?.includes('PERP')).length;

    // Compute average trade size
    const avgSize = trades.reduce((sum, t) => sum + (t.size || 0), 0) / trades.length;

    return `
Total Trades: ${trades.length}
Win Rate: ${((wins / trades.length) * 100).toFixed(1)}%
Wins: ${wins}, Losses: ${losses}
Total PnL: $${totalPnl.toFixed(2)}
Long Trades: ${longs}, Short Trades: ${shorts}
Spot Trades: ${spotTrades}, Perp Trades: ${perpTrades}
Avg Trade Size: ${avgSize.toFixed(4)}
`;
}
