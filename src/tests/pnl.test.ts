import { calculateFifoPnl } from '../src/lib/pnl';
import { Trade } from '../src/types';

const createTrade = (overrides: Partial<Trade> = {}): Trade => ({
    id: 'test',
    wallet: 'test',
    symbol: 'SOL',
    side: 'LONG',
    orderType: 'MARKET',
    price: 100,
    size: 1,
    fees: 0,
    feesUsd: 0,
    pnl: 0,
    realizedPnl: 0,
    unrealizedPnl: 0,
    slippage: 0,
    timestamp: new Date().toISOString(),
    isOnChain: true,
    liquidityTier: 'HIGH',
    isJournaled: false,
    duration: 0,
    isMEVSuspect: false,
    ...overrides
});

async function runTests() {
    console.log("Running PnL Tests...");
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

    // 1. Simple Long Profit
    {
        const trades = [
            createTrade({ timestamp: '2023-01-01', side: 'LONG', price: 100, size: 1 }),
            createTrade({ timestamp: '2023-01-02', side: 'SHORT', price: 110, size: 1 }) // Sell to Close
        ];
        const result = calculateFifoPnl(trades);
        const closeTrade = result[1];
        // Profit = (110 - 100) * 1 = 10
        assert(closeTrade.realizedPnl === 10, `Simple Long: Expected 10, got ${closeTrade.realizedPnl}`);
    }

    // 2. Simple Short Profit (Open Short, Buy to Close)
    {
        // For Shorting: "SHORT" is Open, "LONG" is Close (Buying back)
        // OR "SHORT" subtracts inventory (negative), "LONG" adds (positive).
        // If inventory is 0:
        // Trade 1: SHORT 1 @ 100. Inventory -> -1 @ 100.
        // Trade 2: LONG 1 @ 90. Matches inventory.
        // PnL = (Entry - Exit) * Qty = (100 - 90) * 1 = 10.
        // Logic check: (BatchPrice - Price) * Qty = (100 - 90) * 1 = 10. Correct.

        const trades = [
            createTrade({ timestamp: '2023-01-01', side: 'SHORT', price: 100, size: 1 }),
            createTrade({ timestamp: '2023-01-02', side: 'LONG', price: 90, size: 1 })
        ];
        const result = calculateFifoPnl(trades);
        const closeTrade = result[1];
        assert(closeTrade.realizedPnl === 10, `Simple Short: Expected 10, got ${closeTrade.realizedPnl}`);
    }

    // 3. Partial Fills / Split Exit
    {
        const trades = [
            createTrade({ timestamp: '2023-01-01', side: 'LONG', price: 100, size: 2 }), // Buy 2
            createTrade({ timestamp: '2023-01-02', side: 'SHORT', price: 110, size: 1 }), // Sell 1
            createTrade({ timestamp: '2023-01-03', side: 'SHORT', price: 120, size: 1 })  // Sell 1
        ];
        const result = calculateFifoPnl(trades);

        // Trade 2: (110 - 100) * 1 = 10
        assert(result[1].realizedPnl === 10, `Partial 1: Expected 10, got ${result[1].realizedPnl}`);

        // Trade 3: (120 - 100) * 1 = 20
        assert(result[2].realizedPnl === 20, `Partial 2: Expected 20, got ${result[2].realizedPnl}`);
    }

    // 4. Multiple Entries (FIFO)
    {
        const trades = [
            createTrade({ timestamp: '2023-01-01', side: 'LONG', price: 100, size: 1 }),
            createTrade({ timestamp: '2023-01-02', side: 'LONG', price: 110, size: 1 }),
            createTrade({ timestamp: '2023-01-03', side: 'SHORT', price: 120, size: 1.5 }) // Sell 1.5
        ];
        // FIFO Match:
        // 1.0 from @100. PnL = (120 - 100) * 1 = 20
        // 0.5 from @110. PnL = (120 - 110) * 0.5 = 5
        // Total Realized = 25

        const result = calculateFifoPnl(trades);
        assert(result[2].realizedPnl === 25, `Multi Entry: Expected 25, got ${result[2].realizedPnl}`);
    }

    // 5. Fee Deduction (Net PnL)
    {
        const trades = [
            createTrade({ timestamp: '2023-01-01', side: 'LONG', price: 100, size: 1 }),
            createTrade({ timestamp: '2023-01-02', side: 'SHORT', price: 110, size: 1, feesUsd: 2 })
        ];
        // Realized (Gross) = 10
        // Net PnL = 10 - 2 = 8
        const result = calculateFifoPnl(trades);
        assert(result[1].pnl === 8, `Net PnL: Expected 8, got ${result[1].pnl}`);
    }

    console.log(`\nTests Complete: ${passed} Passed, ${failed} Failed.`);
}

runTests().catch(console.error);
