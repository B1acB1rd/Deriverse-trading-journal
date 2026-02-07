
import { calculateGaslessSavings, calculatePnLAttribution, computeSlippageStats } from '../src/lib/metrics';
import { Trade } from '../src/types';

// Mock Trade Helper
const createTrade = (overrides: Partial<Trade> = {}): Trade => ({
    id: 'test-trade',
    wallet: 'test-wallet',
    symbol: 'SOL-PERP',
    side: 'LONG',
    orderType: 'LIMIT',
    price: 100,
    size: 1,
    fees: 0.1,
    pnl: 10,
    realizedPnl: 10,
    unrealizedPnl: 0,
    slippage: 0.05,
    timestamp: new Date().toISOString(),
    isOnChain: true,
    liquidityTier: 'HIGH',
    isJournaled: false,
    duration: 60,
    isMEVSuspect: false,
    ...overrides
});

// Tests
async function runTests() {
    console.log("Running Metrics Tests...");
    let passed = 0;
    let failed = 0;

    const assert = (condition: boolean, msg: string) => {
        if (condition) {
            console.log(`✅ PASS: ${msg}`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${msg}`);
            failed++;
        }
    };

    // 1. calculateGaslessSavings
    {
        const trades = [
            createTrade({ fees: 1, slippage: 0.5 }), // Cost = 1.5
            createTrade({ fees: 2, slippage: 0.5 })  // Cost = 2.5
        ];
        // Baseline = 20 * 2 = 40
        // Total Cost = 4.0
        // Expected Savings = 36.0
        const savings = calculateGaslessSavings(trades, 20);
        assert(savings === 36, `calculateGaslessSavings: Expected 36, got ${savings}`);
    }

    // 2. calculatePnLAttribution
    {
        const trades = [
            createTrade({ pnl: 50, fees: 2, slippage: 1 }) // Net = 50. Gross should be 50 + 2 + 1 = 53? 
            // WAIT: The function assumes trade.pnl IS Gross or Net?
            // Let's re-read the implementation I wrote:
            // grossPnL = trades.reduce((acc, t) => acc + (t.pnl + (t.fees || 0) + (t.slippage || 0)), 0);
            // This implies t.pnl is NET PnL.
            // So if t.pnl (Net) is 50, Fees 2, Slippage 1
            // Gross = 50 + 2 + 1 = 53.
            // Net Calculated = Gross - Fees - Slippage = 53 - 2 - 1 = 50.
        ];
        const attribution = calculatePnLAttribution(trades);
        assert(attribution.grossPnL === 53, `PnL Attrib: Gross PnL expected 53, got ${attribution.grossPnL}`);
        assert(attribution.netPnL === 50, `PnL Attrib: Net PnL expected 50, got ${attribution.netPnL}`);
    }

    // 3. computeSlippageStats (Windowing & Empty)
    {
        const emptyStats = computeSlippageStats([]);
        assert(emptyStats.mean === 0 && emptyStats.std === 0, "Slippage Stats: Handle empty array");

        const trades = [
            createTrade({ slippage: 1 }), // Oldest
            createTrade({ slippage: 2 }),
            createTrade({ slippage: 3 })  // Newest
        ];

        // Window 2 -> Should take [2, 3]
        const stats = computeSlippageStats(trades, 2);
        // Mean = 2.5
        // Variance (Sample) for [2, 3]: Mean=2.5. (2-2.5)^2 + (3-2.5)^2 = 0.25 + 0.25 = 0.5. Div by (2-1) = 0.5. 
        // Std = sqrt(0.5) approx 0.707

        assert(stats.mean === 2.5, `Slippage Stats: Mean expected 2.5, got ${stats.mean}`);
        assert(Math.abs(stats.std - 0.707) < 0.001, `Slippage Stats: Std expected ~0.707, got ${stats.std}`);
    }

    console.log(`\nTests Complete: ${passed} Passed, ${failed} Failed.`);
}

runTests().catch(console.error);
