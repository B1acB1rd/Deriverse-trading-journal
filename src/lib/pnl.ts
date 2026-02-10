import { Trade } from '../types';

/**
 * FIFO PnL Calculator
 * Matches sells against buys in first-in-first-out order to compute
 * realized PnL for each closing trade. Only processes Spot trades.
 */
export function calculateFifoPnl(trades: Trade[]): Trade[] {
    const chronological = [...trades].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const inventory: Record<string, { price: number, qty: number }[]> = {};

    chronological.forEach(trade => {
        if (trade.positionType !== 'Spot') return;
        const sym = trade.symbol;
        if (!inventory[sym]) inventory[sym] = [];

        const isBuy = trade.side === 'LONG';

        if (isBuy) {
            inventory[sym].push({ price: trade.price, qty: trade.size });
        } else {
            let qtyToSell = trade.size;
            let realizedPnl = 0;

            while (qtyToSell > 0 && inventory[sym].length > 0) {
                const batch = inventory[sym][0];
                const matchedQty = Math.min(qtyToSell, batch.qty);

                const batchPnl = (trade.price - batch.price) * matchedQty;
                realizedPnl += batchPnl;

                batch.qty = batch.qty - matchedQty;
                qtyToSell = qtyToSell - matchedQty;

                if (batch.qty <= 0.000000001) {
                    inventory[sym].shift();
                }
            }

            trade.realizedPnl = realizedPnl;

            // Net PnL = gross realized minus fees
            const feeCost = trade.feesUsd || trade.fees || 0;
            trade.pnl = realizedPnl - feeCost;
        }
    });

    return chronological.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
