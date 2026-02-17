import { Trade } from '../types';

/**
 * FIFO PnL Calculator
 *
 * Matches closing trades against opening trades in first-in-first-out order.
 * Supports both directions:
 *   - Long: BUY opens → SELL closes (PnL = sellPrice - buyPrice)
 *   - Short: SELL opens → BUY closes (PnL = sellPrice - buyPrice)
 *
 * Processes both Spot and Perp fills. Skips deposits, withdrawals,
 * funding payments, and other non-trade entries.
 */
export function calculateFifoPnl(trades: Trade[]): Trade[] {
    const chronological = [...trades].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Separate inventory pools with timestamp tracking
    const longInventory: Record<string, { price: number; qty: number; timestamp: string }[]> = {};
    const shortInventory: Record<string, { price: number; qty: number; timestamp: string }[]> = {};

    chronological.forEach(trade => {
        // Map marketType from positionType
        const pt = (trade.positionType || '').toLowerCase();
        if (pt.includes('perp')) trade.marketType = 'perpetual';
        else if (pt.includes('spot')) trade.marketType = 'spot';
        else trade.marketType = 'spot'; // Default

        // Only process actual fills (Spot and Perp). Skip Deposit, Withdraw, Funding, etc.
        if (pt !== 'spot' && pt !== 'perp') return;

        // Skip trades with no valid price (deposits disguised as trades, etc.)
        if (!trade.price || trade.price <= 0) return;

        const sym = trade.symbol;
        if (!longInventory[sym]) longInventory[sym] = [];
        if (!shortInventory[sym]) shortInventory[sym] = [];

        const isBuy = trade.side === 'LONG';

        if (isBuy) {
            // BUY: Either closing a short position or opening a long
            if (shortInventory[sym].length > 0) {
                // Close shorts (FIFO): PnL = (shortEntryPrice - buyClosePrice) × qty
                let qtyToClose = trade.size;
                let realizedPnl = 0;
                let weightedEntryPrice = 0;
                let totalClosedQty = 0;
                let entryTime = trade.timestamp; // Fallback

                while (qtyToClose > 0 && shortInventory[sym].length > 0) {
                    const batch = shortInventory[sym][0];
                    const matchedQty = Math.min(qtyToClose, batch.qty);

                    // Short profit: sold high, buying back low
                    const batchPnl = (batch.price - trade.price) * matchedQty;
                    realizedPnl += batchPnl;

                    // Track entry stats
                    weightedEntryPrice += batch.price * matchedQty;
                    totalClosedQty += matchedQty;
                    if (totalClosedQty === matchedQty) entryTime = batch.timestamp; // Capture earliest

                    batch.qty -= matchedQty;
                    qtyToClose -= matchedQty;

                    if (batch.qty <= 1e-9) {
                        shortInventory[sym].shift();
                    }
                }

                // If any qty left over, it opens a new long
                if (qtyToClose > 1e-9) {
                    longInventory[sym].push({ price: trade.price, qty: qtyToClose, timestamp: trade.timestamp });
                }

                // Populate Closing Trade Details
                trade.realizedPnl = realizedPnl;
                const feeCost = trade.fees || 0;
                trade.pnl = realizedPnl - feeCost;

                trade.entryPrice = totalClosedQty > 0 ? weightedEntryPrice / totalClosedQty : trade.price;
                trade.exitPrice = trade.price;
                trade.entryTime = entryTime;
                trade.exitTime = trade.timestamp;
                trade.status = 'CLOSED';

            } else {
                // No shorts to close — this buy OPENS a long position
                longInventory[sym].push({ price: trade.price, qty: trade.size, timestamp: trade.timestamp });
                // Reset PnL for opening positions
                trade.pnl = 0;
                trade.realizedPnl = 0;
                trade.entryPrice = trade.price;
                trade.status = 'OPEN';
            }
        } else {
            // SELL: Either closing a long position or opening a short
            if (longInventory[sym].length > 0) {
                // Close longs (FIFO): PnL = (sellClosePrice - longEntryPrice) × qty
                let qtyToClose = trade.size;
                let realizedPnl = 0;
                let weightedEntryPrice = 0;
                let totalClosedQty = 0;
                let entryTime = trade.timestamp;

                while (qtyToClose > 0 && longInventory[sym].length > 0) {
                    const batch = longInventory[sym][0];
                    const matchedQty = Math.min(qtyToClose, batch.qty);

                    // Long profit: bought low, selling high
                    const batchPnl = (trade.price - batch.price) * matchedQty;
                    realizedPnl += batchPnl;

                    // Track entry stats
                    weightedEntryPrice += batch.price * matchedQty;
                    totalClosedQty += matchedQty;
                    if (totalClosedQty === matchedQty) entryTime = batch.timestamp;

                    batch.qty -= matchedQty;
                    qtyToClose -= matchedQty;

                    if (batch.qty <= 1e-9) {
                        longInventory[sym].shift();
                    }
                }

                // If any qty left over, it opens a new short
                if (qtyToClose > 1e-9) {
                    shortInventory[sym].push({ price: trade.price, qty: qtyToClose, timestamp: trade.timestamp });
                }

                // Populate Closing Trade Details
                trade.realizedPnl = realizedPnl;
                const feeCost = trade.fees || 0;
                trade.pnl = realizedPnl - feeCost;

                trade.entryPrice = totalClosedQty > 0 ? weightedEntryPrice / totalClosedQty : trade.price;
                trade.exitPrice = trade.price;
                trade.entryTime = entryTime;
                trade.exitTime = trade.timestamp;
                trade.status = 'CLOSED';

            } else {
                // No longs to close — this sell OPENS a short position
                shortInventory[sym].push({ price: trade.price, qty: trade.size, timestamp: trade.timestamp });
                // Reset PnL for opening positions
                trade.pnl = 0;
                trade.realizedPnl = 0;
                trade.entryPrice = trade.price;
                trade.status = 'OPEN';
            }
        }
    });

    // Return in reverse chronological order (newest first) for display
    return chronological.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
}
