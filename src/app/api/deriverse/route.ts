import { NextRequest, NextResponse } from 'next/server';
import { DeriverseService } from '@/services/DeriverseService';
import { storeTrades, getTrades, updateAccountStats, getAccountStats } from '@/lib/AccountStorage';
import { initializeIndexes } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// Initialize MongoDB indexes on first load
let indexesInitialized = false;

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get('wallet');
    const refresh = searchParams.get('refresh') === 'true'; // Force refresh from chain

    if (!wallet) {
        return NextResponse.json({ success: false, error: 'Wallet address required' }, { status: 400 });
    }

    try {
        // Initialize MongoDB indexes once
        if (!indexesInitialized && process.env.MONGODB_URI) {
            try {
                await initializeIndexes();
                indexesInitialized = true;
            } catch (e) {
                console.warn('[MongoDB] Failed to initialize indexes, continuing without caching:', e);
            }
        }

        const service = DeriverseService.getInstance();
        const clientData = await service.fetchClientData(wallet);

        if (!clientData) {
            // No client data found, return empty state but success
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

        // Map Tokens to Dashboard Asset Format
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

        // Map Positions
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

        // === MONGODB CACHING: Trades ===
        let trades: any[] = [];

        if (process.env.MONGODB_URI) {
            try {
                // Get cached trades from MongoDB
                const cachedTrades = await getTrades(wallet, { limit: 200 });

                // Always fetch fresh trades from chain (or fetch only new ones)
                const freshTrades = await service.fetchTradeHistory(wallet);

                // Store new trades in MongoDB (with deduplication)
                if (freshTrades.length > 0) {
                    await storeTrades(wallet, freshTrades);
                }

                // Use fresh trades as the main source (includes latest data)
                trades = freshTrades;

                // Update account stats in MongoDB
                await updateAccountStats(wallet, clientData.perpStats);

                console.log(`[MongoDB] Cached ${freshTrades.length} trades for ${wallet.slice(0, 8)}...`);
            } catch (dbError) {
                console.warn('[MongoDB] Cache operation failed, using fresh data:', dbError);
                trades = await service.fetchTradeHistory(wallet);
            }
        } else {
            // No MongoDB configured, fetch directly
            trades = await service.fetchTradeHistory(wallet);
        }

        // Map LP Positions
        const lpPositions = clientData.lpPositions?.map(lp => ({
            instrId: lp.instrId,
            symbol: lp.symbol,
            lpTokens: lp.lpTokens,
            valuationUsdc: lp.valuationUsdc
        })) || [];

        // Map Perp Open Orders
        const perpOpenOrders = clientData.perpOpenOrders?.map(o => ({
            instrId: o.instrId,
            orderId: o.orderId,
            side: o.side,
            price: o.price,
            amount: o.amount
        })) || [];

        // Map Perp Stats
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

        // Construct Response
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

