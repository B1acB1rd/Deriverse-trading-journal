import { NextRequest, NextResponse } from 'next/server';
import { DeriverseService } from '@/services/DeriverseService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
        return NextResponse.json({ success: false, error: 'Wallet address required' }, { status: 400 });
    }

    try {
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
        // Note: This mapping depends on knowing which mint is which. 
        // For now, we map dynamically based on known mints in env or generic.
        const assets = {
            sol: 0,
            usdc: 0,
            deriverse: 0
        };

        // Helper to identify tokens (approximate if env vars match)
        const MINT_A = process.env.NEXT_PUBLIC_TOKEN_MINT_A;
        const MINT_B = process.env.NEXT_PUBLIC_TOKEN_MINT_B;

        // CORRECT MAPPING based on official kit-example-retry:
        // TOKEN_MINT_A = 9pan9bMn5HatX4EJdBwg9VgCa7Uz5HL8N1m5D3NdXejP = Wrapped SOL (Token ID 2)
        // TOKEN_MINT_B = A2Pz6rVyXuadFkKnhMXd1w9xgSrZd8m8sEGpuGuyFhaj = Fake USDC (Token ID 1)
        clientData.balances.forEach(b => {
            if (b.mint === MINT_A) assets.sol = b.amount; // MINT_A = SOL
            else if (b.mint === MINT_B) assets.usdc = b.amount; // MINT_B = USDC
        });

        // Set Equity
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

        // Fetch Orders for active instruments
        // We iterate through active positions instruments or all instruments?
        // For efficiency, maybe just check the main instrument if known, 
        // but robustly we should probably scan known instruments. 
        // For now, we'll try to fetch orders for the active instruments found.
        let allOrders: any[] = [];

        // Also try to fetch orders for Mint A/B instrument if defined
        // const instruments = await service.getAvailableInstruments();
        // ... logic to find relevant instruments ...


        // Fetch real trade history from transaction logs
        const trades = await service.fetchTradeHistory(wallet);

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
            balance: assets.usdc, // Main Equity approximated as USDC balance
            assets,
            positions,
            orders: [...allOrders, ...perpOpenOrders], // Include perp orders
            trades, // Real trade history from logs
            lpPositions, // LP/Liquidity positions
            perpStats,   // Perp account statistics
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
