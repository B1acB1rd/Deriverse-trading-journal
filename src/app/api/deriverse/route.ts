import { NextRequest, NextResponse } from 'next/server';
import { DeriverseService } from '@/services/DeriverseService';
import { storeTrades, getTrades, updateAccountStats, getAccountStats, getLatestTradeSignature } from '@/lib/AccountStorage';
import { initializeIndexes } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';


let indexesInitialized = false;

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get('wallet');
    const refresh = searchParams.get('refresh') === 'true';

    if (!wallet) {
        return NextResponse.json({ success: false, error: 'Wallet address required' }, { status: 400 });
    }

    try {

        if (!indexesInitialized && process.env.MONGODB_URI) {
            try {
                await initializeIndexes();
                indexesInitialized = true;
            } catch (e) {
                console.warn('[MongoDB] Failed to initialize indexes, continuing without caching:', e);
            }
        }

        const service = DeriverseService.getInstance();
        // Apply custom RPC if provided (optional, does not interfere if absent)
        const customRpc = searchParams.get('rpc');
        if (customRpc) service.setCustomRpc(customRpc);
        const clientData = await service.fetchClientData(wallet);

        if (!clientData) {

            return NextResponse.json({
                success: true,
                balance: 0,
                assets: { sol: 0, usdc: 0, deriverse: 0 },
                positions: [],
                orders: [],
                trades: [],
                lpPositions: [],
                perpStats: [],
                pnl: { unrealized: 0, realized: 0, total: 0 }
            });
        }


        const assets = {
            sol: 0,
            usdc: 0,
            deriverse: 0
        };

        const MINT_A = process.env.NEXT_PUBLIC_TOKEN_MINT_A;
        const MINT_B = process.env.NEXT_PUBLIC_TOKEN_MINT_B;

        clientData.balances.forEach(b => {
            if (b.mint === MINT_A) assets.sol = b.amount;
            else if (b.mint === MINT_B) assets.usdc = b.amount;
        });

        assets.deriverse = clientData.equity || 0;


        const positions = clientData.activePositions.map(p => ({
            symbol: p.symbol,
            side: p.side,
            size: p.size,
            entryPrice: p.entryPrice,
            markPrice: p.markPrice,
            pnl: p.pnl,
            leverage: p.leverage || 1
        }));

        let allOrders: any[] = [];

        // Incremental trade sync: load cached + fetch only new trades from chain
        let trades: any[] = [];

        const mapCachedToApiFormat = (cachedTrades: any[]) => cachedTrades.map(t => ({
            id: t.tradeId,
            type: t.type,
            side: t.side,
            symbol: t.symbol,
            price: t.price,
            size: t.size,
            pnl: t.pnl,
            fee: t.fee,
            realizedPnl: t.realizedPnl,
            timestamp: t.timestamp instanceof Date ? t.timestamp.toISOString() : t.timestamp,
            status: 'COMPLETED',
            section: t.section,
            chainTx: t.signature
        }));

        if (process.env.MONGODB_URI) {
            try {
                // Step 1: Check if we have cached trades and get the latest signature
                const latestSignature = await getLatestTradeSignature(wallet);
                const cachedTrades = await getTrades(wallet, { limit: 1000 });
                const isFirstSync = cachedTrades.length === 0;

                console.log(`[API] ${isFirstSync ? 'First sync' : `Incremental sync (${cachedTrades.length} cached)`} for ${wallet.slice(0, 8)}...`);

                // Step 2: Fetch new trades from blockchain
                // If we have cached data, only fetch transactions newer than our latest signature
                // If first sync (or forced refresh), fetch everything
                let freshTrades: any[] = [];
                try {
                    if (isFirstSync || refresh) {
                        freshTrades = await service.fetchTradeHistory(wallet);
                        console.log(`[API] Full fetch: ${freshTrades.length} trades from chain`);
                    } else {
                        freshTrades = await service.fetchTradeHistory(wallet, latestSignature || undefined);
                        console.log(`[API] Incremental fetch: ${freshTrades.length} new trades from chain`);
                    }
                } catch (fetchError: any) {
                    console.warn(`[API] Blockchain fetch failed: ${fetchError.message}`);
                    // Continue with cached data only
                }

                // Step 3: Persist any new trades to MongoDB
                if (freshTrades.length > 0) {
                    try {
                        const storedCount = await storeTrades(wallet, freshTrades);
                        console.log(`[API] Persisted ${storedCount} new trades to MongoDB`);
                    } catch (storeError: any) {
                        console.error(`[API] Failed to persist trades: ${storeError.message}`);
                    }
                }

                // Step 4: Return the complete trade history
                if (freshTrades.length > 0 && cachedTrades.length > 0) {
                    // Merge: fresh trades + cached trades (deduplicated by returning all from DB)
                    const allCached = await getTrades(wallet, { limit: 1000 });
                    trades = mapCachedToApiFormat(allCached);
                    console.log(`[API] Returning ${trades.length} total trades (merged)`);
                } else if (freshTrades.length > 0) {
                    // First sync — return fresh trades directly
                    trades = freshTrades;
                } else if (cachedTrades.length > 0) {
                    // No new trades — return cached
                    trades = mapCachedToApiFormat(cachedTrades);
                    console.log(`[API] Returning ${trades.length} cached trades (no new from chain)`);
                }

                // Update account stats
                await updateAccountStats(wallet, clientData.perpStats);

            } catch (dbError: any) {
                // MongoDB entirely unavailable — fetch everything from chain
                console.warn(`[API] MongoDB unavailable: ${dbError.message}, fetching from chain only`);
                try {
                    trades = await service.fetchTradeHistory(wallet);
                } catch {
                    trades = [];
                }
            }
        } else {
            // No MongoDB configured — fetch from blockchain only
            trades = await service.fetchTradeHistory(wallet);
        }


        const lpPositions = clientData.lpPositions?.map(lp => ({
            instrId: lp.instrId,
            symbol: lp.symbol,
            lpTokens: lp.lpTokens,
            valuationUsdc: lp.valuationUsdc
        })) || [];


        const perpOpenOrders = clientData.perpOpenOrders?.map(o => ({
            instrId: o.instrId,
            orderId: o.orderId,
            side: o.side,
            price: o.price,
            amount: o.amount
        })) || [];


        const perpStats = clientData.perpStats?.map(s => ({
            instrId: s.instrId,
            position: s.position,
            funds: s.funds,
            realizedPnl: s.realizedPnl,
            fees: s.fees,
            rebates: s.rebates,
            fundingFunds: s.fundingFunds,
            leverage: s.leverage
        })) || [];


        return NextResponse.json({
            success: true,
            balance: assets.usdc,
            assets,
            positions,
            orders: [...allOrders, ...perpOpenOrders],
            trades,
            lpPositions,
            perpStats,
            pnl: {
                unrealized: clientData.totalUnrealizedPnl || 0,
                realized: clientData.totalRealizedPnl || 0,
                total: (clientData.totalUnrealizedPnl || 0) + (clientData.totalRealizedPnl || 0)
            }
        });


    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

