import { calculateFifoPnl } from '../lib/pnl';
import { Trade } from '../types';

const createTrade = (overrides: Partial<Trade> = {}): Trade => ({
    id: 'test',
    wallet: 'test',
    symbol: 'SOL/USDC',
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
    positionType: 'Spot', // Default to Spot — FIFO requires this
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
        // SHORT opens a position in shortInventory
        // LONG closes it: PnL = (shortEntry - buyClose) * qty = (100 - 90) * 1 = 10
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

    // ── NEW: Perp-specific tests ──

    // 6. Perp Long Profit
    {
        const trades = [
            createTrade({ timestamp: '2023-01-01', side: 'LONG', price: 75, size: 0.5, symbol: 'SOL-PERP', positionType: 'Perp' }),
            createTrade({ timestamp: '2023-01-02', side: 'SHORT', price: 80, size: 0.5, symbol: 'SOL-PERP', positionType: 'Perp' })
        ];
        const result = calculateFifoPnl(trades);
        // PnL = (80 - 75) * 0.5 = 2.5
        assert(result[1].realizedPnl === 2.5, `Perp Long: Expected 2.5, got ${result[1].realizedPnl}`);
    }

    // 7. Perp Short Profit
    {
        const trades = [
            createTrade({ timestamp: '2023-01-01', side: 'SHORT', price: 80, size: 1, symbol: 'SOL-PERP', positionType: 'Perp' }),
            createTrade({ timestamp: '2023-01-02', side: 'LONG', price: 70, size: 1, symbol: 'SOL-PERP', positionType: 'Perp' })
        ];
        const result = calculateFifoPnl(trades);
        // PnL = (80 - 70) * 1 = 10
        assert(result[1].realizedPnl === 10, `Perp Short: Expected 10, got ${result[1].realizedPnl}`);
    }

    // 8. Deposits/Withdrawals are SKIPPED (no ghost PnL)
    {
        const trades = [
            createTrade({ timestamp: '2023-01-01', side: 'LONG', price: 0, size: 18, symbol: 'SOL-PERP', positionType: 'Deposit' }),
            createTrade({ timestamp: '2023-01-02', side: 'LONG', price: 75, size: 0.5, symbol: 'SOL-PERP', positionType: 'Perp' }),
        ];
        const result = calculateFifoPnl(trades);
        // The deposit should NOT affect PnL at all
        assert(result[0].pnl === 0, `Deposit Ghost: Expected PnL 0, got ${result[0].pnl}`);
        assert(result[1].pnl === 0, `Perp Open: Expected PnL 0 (no close yet), got ${result[1].pnl}`);
    }

    // 9. Zero-price trades are skipped (safety)
    {
        const trades = [
            createTrade({ timestamp: '2023-01-01', side: 'LONG', price: 0, size: 1, positionType: 'Spot' }),
            createTrade({ timestamp: '2023-01-02', side: 'SHORT', price: 110, size: 1, positionType: 'Spot' })
        ];
        const result = calculateFifoPnl(trades);
        // The zero-price buy should be skipped, so the sell opens a short instead
        assert(result[1].pnl === 0, `Zero Price: Expected 0 (no match), got ${result[1].pnl}`);
    }

    // 10. Short Loss
    {
        const trades = [
            createTrade({ timestamp: '2023-01-01', side: 'SHORT', price: 100, size: 1 }),
            createTrade({ timestamp: '2023-01-02', side: 'LONG', price: 120, size: 1 }) // Buy back higher = loss
        ];
        const result = calculateFifoPnl(trades);
        // PnL = (100 - 120) * 1 = -20 (loss)
        assert(result[1].realizedPnl === -20, `Short Loss: Expected -20, got ${result[1].realizedPnl}`);
    }

    console.log(`\nTests Complete: ${passed} Passed, ${failed} Failed.`);
}

runTests().catch(console.error);
