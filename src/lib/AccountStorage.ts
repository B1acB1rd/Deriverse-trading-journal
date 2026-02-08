import { getDatabase, getTradesCollection, getAccountStatsCollection, TradeDocument, AccountStatsDocument } from './mongodb';

/**
 * Store trades to MongoDB (with deduplication)
 */
export async function storeTrades(walletAddress: string, trades: any[]): Promise<number> {
    const collection = await getTradesCollection();
    let insertedCount = 0;

    for (const trade of trades) {
        try {
            const tradeDoc: TradeDocument = {
                walletAddress,
                tradeId: trade.id,
                type: trade.type || 'Spot',
                side: trade.side,
                symbol: trade.symbol,
                price: trade.price || 0,
                size: trade.size || 0,
                fee: trade.fee || 0,
                pnl: trade.pnl || 0,
                realizedPnl: trade.realizedPnl || 0,
                timestamp: new Date(trade.timestamp),
                signature: trade.id.split('-')[1] || trade.id,
                section: trade.section || trade.type,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Upsert (insert if not exists)
            const result = await collection.updateOne(
                { walletAddress, tradeId: trade.id },
                {
                    $setOnInsert: tradeDoc,
                    $set: { updatedAt: new Date() }
                },
                { upsert: true }
            );

            if (result.upsertedCount > 0) {
                insertedCount++;
            }
        } catch (error: any) {
            console.warn(`[AccountStorage] Failed to store trade ${trade.id}: ${error.message}`);
        }
    }

    console.log(`[AccountStorage] Stored ${insertedCount} new trades for ${walletAddress}`);
    return insertedCount;
}

/**
 * Get trades from MongoDB for a wallet
 */
export async function getTrades(walletAddress: string, options?: {
    limit?: number;
    afterTimestamp?: Date;
    type?: 'Spot' | 'Perp' | 'Deposit' | 'Withdraw';
}): Promise<TradeDocument[]> {
    const collection = await getTradesCollection();

    const filter: any = { walletAddress };

    if (options?.afterTimestamp) {
        filter.timestamp = { $gt: options.afterTimestamp };
    }

    if (options?.type) {
        filter.type = options.type;
    }

    const cursor = collection
        .find(filter)
        .sort({ timestamp: -1 });

    if (options?.limit) {
        cursor.limit(options.limit);
    }

    return cursor.toArray();
}

/**
 * Get the latest trade timestamp for a wallet
 */
export async function getLatestTradeTimestamp(walletAddress: string): Promise<Date | null> {
    const collection = await getTradesCollection();

    const latestTrade = await collection
        .findOne({ walletAddress }, { sort: { timestamp: -1 } });

    return latestTrade?.timestamp || null;
}

/**
 * Calculate and store account statistics
 */
export async function updateAccountStats(walletAddress: string, perpStats?: any[]): Promise<AccountStatsDocument> {
    const tradesCollection = await getTradesCollection();
    const statsCollection = await getAccountStatsCollection();

    // Aggregate stats from trades
    const tradesAggregation = await tradesCollection.aggregate([
        { $match: { walletAddress } },
        {
            $group: {
                _id: '$walletAddress',
                totalRealizedPnl: { $sum: '$realizedPnl' },
                totalFees: { $sum: '$fee' },
                tradeCount: { $sum: 1 }
            }
        }
    ]).toArray();

    const tradeStats = tradesAggregation[0] || { totalRealizedPnl: 0, totalFees: 0, tradeCount: 0 };

    // Add perp stats if provided
    let totalRebates = 0;
    let totalFunding = 0;
    let perpRealizedPnl = 0;

    if (perpStats && perpStats.length > 0) {
        for (const stat of perpStats) {
            perpRealizedPnl += stat.realizedPnl || 0;
            totalRebates += stat.rebates || 0;
            totalFunding += stat.fundingFunds || 0;
        }
    }

    // Calculate total PnL
    const totalRealizedPnl = tradeStats.totalRealizedPnl + perpRealizedPnl;
    const netPnL = totalRealizedPnl - tradeStats.totalFees + totalRebates + totalFunding;

    const statsDoc: AccountStatsDocument = {
        walletAddress,
        totalRealizedPnl,
        totalFees: tradeStats.totalFees,
        totalRebates,
        totalFunding,
        netPnL,
        tradeCount: tradeStats.tradeCount,
        lastUpdated: new Date()
    };

    // Upsert account stats
    await statsCollection.updateOne(
        { walletAddress },
        { $set: statsDoc },
        { upsert: true }
    );

    console.log(`[AccountStorage] Updated stats for ${walletAddress}: Net PnL = ${netPnL.toFixed(2)}`);
    return statsDoc;
}

/**
 * Get account statistics from MongoDB
 */
export async function getAccountStats(walletAddress: string): Promise<AccountStatsDocument | null> {
    const collection = await getAccountStatsCollection();
    return collection.findOne({ walletAddress });
}

/**
 * Calculate total PnL from all historical data (not resettable)
 */
export async function calculateTotalPnL(walletAddress: string): Promise<{
    totalRealizedPnl: number;
    totalFees: number;
    totalRebates: number;
    totalFunding: number;
    netPnL: number;
}> {
    const stats = await getAccountStats(walletAddress);

    if (stats) {
        return {
            totalRealizedPnl: stats.totalRealizedPnl,
            totalFees: stats.totalFees,
            totalRebates: stats.totalRebates,
            totalFunding: stats.totalFunding,
            netPnL: stats.netPnL
        };
    }

    // Default empty stats
    return {
        totalRealizedPnl: 0,
        totalFees: 0,
        totalRebates: 0,
        totalFunding: 0,
        netPnL: 0
    };
}
