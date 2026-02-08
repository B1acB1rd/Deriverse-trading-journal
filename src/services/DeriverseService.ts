

import {
    address,
    createSolanaRpc,
    devnet,
    Address
} from "@solana/kit";
import { Engine } from '@deriverse/kit';

// Configuration from env
const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://api.devnet.solana.com';
const PROGRAM_ID = process.env.NEXT_PUBLIC_DERIVERSE_PROGRAM_ID || 'Drvrseg8AQLP8B96DBGmHRjFGviFNYTkHueY9g3k27Gu';
const VERSION = parseInt(process.env.NEXT_PUBLIC_DERIVERSE_VERSION || '12');
const TOKEN_MINT_A = process.env.NEXT_PUBLIC_TOKEN_MINT_A;
const TOKEN_MINT_B = process.env.NEXT_PUBLIC_TOKEN_MINT_B;

export interface TokenBalance {
    mint: string;
    amount: number;
    tokenId: number;
}

export interface ActivePosition {
    type: 'SPOT' | 'PERP';
    instrId: number;
    symbol: string;
    side: 'LONG' | 'SHORT';
    size: number;
    entryPrice: number;
    markPrice: number;
    pnl: number;
    unrealizedPnl: number;
    leverage?: number;
    clientId?: number;
    // Raw SDK data
    rawData?: any;
}

// LP/Liquidity Position
export interface LpPosition {
    instrId: number;
    symbol: string;
    lpTokens: number;
    valuationUsdc: number;
}

// Perp Open Order
export interface PerpOpenOrder {
    instrId: number;
    orderId: number;
    side: 'BID' | 'ASK';
    price: number;
    amount: number;
    timestamp?: string;
}

// Perp Account Stats (from GetClientPerpOrdersInfoResponse)
export interface PerpStats {
    instrId: number;
    position: number;       // perps field
    funds: number;          // funds in margin
    inOrdersPerps: number;
    inOrdersFunds: number;
    realizedPnl: number;    // result field
    fees: number;
    rebates: number;
    fundingFunds: number;
    leverage: number;
}

export interface ClientTradeData {
    clientId: number;
    balances: TokenBalance[];
    activePositions: ActivePosition[];
    lpPositions: LpPosition[];        // NEW: LP/Liquidity positions
    perpOpenOrders: PerpOpenOrder[];  // NEW: Open perp orders
    perpStats: PerpStats[];           // NEW: Perp account statistics
    totalPnl: number;
    totalUnrealizedPnl: number;
    totalRealizedPnl: number;         // NEW: From perp stats
    equity: number;
}


export class DeriverseService {
    private static instance: DeriverseService;
    private engine: Engine | null = null;
    private rpc: any;
    private isInitialized = false;
    private currentWallet: string | null = null;

    private constructor() {
        // Initialize RPC with proper endpoint
        console.log("DeriverseService: Using RPC endpoint:", RPC_ENDPOINT);
        this.rpc = createSolanaRpc(devnet(RPC_ENDPOINT));
    }

    public static getInstance(): DeriverseService {
        if (!DeriverseService.instance) {
            DeriverseService.instance = new DeriverseService();
        }
        return DeriverseService.instance;
    }

    public async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            console.log("Initializing Deriverse Engine...", { PROGRAM_ID, VERSION });
            this.engine = new Engine(this.rpc, {
                programId: address(PROGRAM_ID),
                version: VERSION
            });
            await this.engine.initialize();
            this.isInitialized = true;
            console.log("Deriverse Engine Initialized Successfully");
        } catch (error) {
            console.error("Failed to initialize Deriverse Engine:", error);
            throw error;
        }
    }

    /**
     * Fetch complete client data including positions with real prices
     */
    public async fetchClientData(walletPublicKey: string): Promise<ClientTradeData | null> {
        if (!this.engine || !this.isInitialized) {
            await this.initialize();
        }

        try {
            if (!this.engine) throw new Error("Engine failed to initialize");

            // Set the "signer" context to the user's wallet address
            await this.engine.setSigner(address(walletPublicKey));
            this.currentWallet = walletPublicKey;

            // Check if client exists
            if (!this.engine.originalClientId) {
                console.log("No Deriverse account found for wallet:", walletPublicKey);
                return null;
            }

            console.log("Found Deriverse Client ID:", this.engine.originalClientId);

            // Fetch client data from SDK
            const clientData = await this.engine.getClientData();

            // --- Fetch Token Balances ---
            const balances: TokenBalance[] = [];

            // Helper to get balance for a mint
            const processBalance = async (mintStr: string | undefined) => {
                if (!mintStr) return;
                try {
                    // Try to get tokenId from the mint
                    const tokenId = await this.engine!.getTokenId(address(mintStr));
                    if (tokenId != null && clientData.tokens) {
                        const tokenData = clientData.tokens.get(tokenId);
                        if (tokenData) {
                            balances.push({
                                mint: mintStr,
                                amount: Number(tokenData.amount), // This is Quantity (e.g. 5.1 SOL)
                                tokenId
                            });
                        }
                    }
                } catch (e) {
                    // Ignore tokens we can't find
                }
            };

            await processBalance(TOKEN_MINT_A);
            await processBalance(TOKEN_MINT_B);

            // --- Fetch Active Positions with Market Data ---
            const activePositions: ActivePosition[] = [];
            let totalPnl = 0;
            let totalUnrealizedPnl = 0;

            // Process SPOT positions
            if (clientData.spot) {
                for (const [instrId, position] of clientData.spot.entries()) {
                    try {
                        // Update instrument data to get current prices
                        await this.engine.updateInstrData({ instrId });
                        const instr = this.engine.instruments?.get(instrId);

                        if (instr) {
                            const markPrice = instr.header.lastPx || 0;
                            // Spot uses availAssetTokens and availCrncyTokens
                            const assetTokens = Number((position as any).availAssetTokens || 0);
                            const crncyTokens = Number((position as any).availCrncyTokens || 0);
                            const positionSize = assetTokens;
                            const side: 'LONG' | 'SHORT' = positionSize >= 0 ? 'LONG' : 'SHORT';

                            // Calculate position value and entry price
                            const currentValue = Math.abs(positionSize) * markPrice;
                            // Entry price approximated from currency tokens / asset tokens
                            const entryPrice = assetTokens > 0 ? crncyTokens / assetTokens : markPrice;
                            const unrealizedPnl = (markPrice - entryPrice) * positionSize;

                            activePositions.push({
                                type: 'SPOT',
                                instrId,
                                symbol: `SPOT-${instrId}`,
                                side,
                                size: Math.abs(positionSize),
                                entryPrice,
                                markPrice,
                                pnl: unrealizedPnl,
                                unrealizedPnl,
                                clientId: (position as any).client,
                                rawData: position
                            });

                            totalUnrealizedPnl += unrealizedPnl;
                        }
                    } catch (instrError) {
                        console.warn(`Failed to fetch instrument data for SPOT ${instrId}:`, instrError);
                    }
                }
            } // end if (clientData.spot)

            // Process PERP positions
            if (clientData.perp) {
                for (const [instrId, position] of clientData.perp.entries()) {
                    try {
                        // Update instrument data to get current prices
                        await this.engine.updateInstrData({ instrId });
                        const instr = this.engine.instruments?.get(instrId);

                        if (instr) {
                            // Perp uses perpLastPx for perpetual positions
                            const markPrice = instr.header.perpLastPx || instr.header.lastPx || 0;
                            // PerpClientInfoModel has: funds, perps, inOrdersFunds, inOrdersPerps
                            const perpPosition = position as any;
                            const positionSize = Number(perpPosition.perps || 0);
                            const side: 'LONG' | 'SHORT' = positionSize >= 0 ? 'LONG' : 'SHORT';
                            const funds = Number(perpPosition.funds || 0);
                            const cost = Number(perpPosition.cost || 0);

                            // Calculate PnL for perpetuals
                            // Notional = position size * current price
                            const notional = positionSize * markPrice;
                            // Entry price (cost basis per unit)
                            const entryPrice = Math.abs(positionSize) > 0 ? Math.abs(cost) / Math.abs(positionSize) : markPrice;
                            // Unrealized PnL = current value - cost basis
                            const unrealizedPnl = notional - cost;

                            activePositions.push({
                                type: 'PERP',
                                instrId,
                                symbol: `PERP-${instrId}`,
                                side,
                                size: Math.abs(positionSize),
                                entryPrice,
                                markPrice,
                                pnl: unrealizedPnl,
                                unrealizedPnl,
                                leverage: 10,
                                clientId: perpPosition.client,
                                rawData: position
                            });

                            totalUnrealizedPnl += unrealizedPnl;
                        }
                    } catch (instrError) {
                        console.warn(`Failed to fetch instrument data for PERP ${instrId}:`, instrError);
                    }
                }
            } // end if (clientData.perp)

            totalPnl = totalUnrealizedPnl; // For open positions, total PnL = unrealized PnL

            // --- Fetch LP Positions ---
            const lpPositions: LpPosition[] = [];
            if (clientData.lp) {
                for (const [instrId, lpData] of clientData.lp.entries()) {
                    try {
                        // Update instrument to get current price for valuation
                        await this.engine.updateInstrData({ instrId });
                        const instr = this.engine.instruments?.get(instrId);
                        const markPrice = instr?.header?.lastPx || 0;
                        const lpTokens = Number((lpData as any).amount || 0);

                        // LP valuation approximation (LP tokens * mark price as rough estimate)
                        const valuationUsdc = lpTokens * markPrice;

                        lpPositions.push({
                            instrId,
                            symbol: `SOL/USDC`,
                            lpTokens,
                            valuationUsdc
                        });
                    } catch (e) {
                        console.warn(`Failed to process LP position for instrId ${instrId}:`, e);
                    }
                }
            }

            // --- Fetch Perp Stats and Open Orders ---
            const perpStats: PerpStats[] = [];
            const perpOpenOrders: PerpOpenOrder[] = [];
            let totalRealizedPnl = 0;

            if (clientData.perp) {
                for (const [instrId, perpData] of clientData.perp.entries()) {
                    try {
                        const perpClientId = (perpData as any).clientId;
                        if (perpClientId == null) continue;

                        // Get perp orders info which contains stats
                        const perpInfo = await this.engine.getClientPerpOrdersInfo({
                            instrId,
                            clientId: perpClientId
                        });

                        if (perpInfo) {
                            // Extract leverage from mask (first byte)
                            const leverage = (perpInfo.mask || 0) & 0xFF || 10;

                            // USDC normalization factor (6 decimals)
                            const USDC_DECIMALS = 1_000_000;

                            perpStats.push({
                                instrId,
                                position: perpInfo.perps || 0,
                                funds: (perpInfo.funds || 0) / USDC_DECIMALS,
                                inOrdersPerps: perpInfo.inOrdersPerps || 0,
                                inOrdersFunds: (perpInfo.inOrdersFunds || 0) / USDC_DECIMALS,
                                realizedPnl: (perpInfo.result || 0) / USDC_DECIMALS,
                                fees: (perpInfo.fees || 0) / USDC_DECIMALS,
                                rebates: (perpInfo.rebates || 0) / USDC_DECIMALS,
                                fundingFunds: (perpInfo.fundingFunds || 0) / USDC_DECIMALS,
                                leverage
                            });

                            totalRealizedPnl += (perpInfo.result || 0) / USDC_DECIMALS;

                            // Fetch open orders if any
                            if (perpInfo.bidsCount > 0 || perpInfo.asksCount > 0) {
                                const orders = await this.engine.getClientPerpOrders({
                                    instrId,
                                    bidsCount: perpInfo.bidsCount,
                                    asksCount: perpInfo.asksCount,
                                    bidsEntry: perpInfo.bidsEntry,
                                    asksEntry: perpInfo.asksEntry
                                });

                                // Process bid orders
                                for (const bid of (orders.bids || [])) {
                                    const o = bid as any;
                                    perpOpenOrders.push({
                                        instrId,
                                        orderId: Number(o.orderId || 0),
                                        side: 'BID',
                                        price: Number(o.px || o.price || 0),
                                        amount: Number(o.qty || o.perps || 0)
                                    });
                                }

                                // Process ask orders
                                for (const ask of (orders.asks || [])) {
                                    const o = ask as any;
                                    perpOpenOrders.push({
                                        instrId,
                                        orderId: Number(o.orderId || 0),
                                        side: 'ASK',
                                        price: Number(o.px || o.price || 0),
                                        amount: Number(o.qty || o.perps || 0)
                                    });
                                }
                            }
                        }
                    } catch (e) {
                        console.warn(`Failed to fetch perp stats for instrId ${instrId}:`, e);
                    }
                }
            }

            // Calculate Equity (Balances Value + Unrealized PnL)
            let equity = 0;

            // Need prices for balances
            let solPrice = 0;
            // Try to find price for SOL/USDC
            if (this.engine!.instruments) {
                for (const instr of this.engine!.instruments.values() as any) {
                    if ((instr.symbol && instr.symbol.includes('SOL'))) {
                        solPrice = Number(instr.header?.markPrice || instr.header?.lastPx || instr.markPrice || 0);
                        break;
                    }
                }
            }
            if (solPrice === 0) solPrice = 100; // Fallback to reasonable default if fetch fails

            balances.forEach(b => {
                if (b.tokenId === 1) { // 1 = USDC
                    equity += b.amount * 1.0;
                } else if (b.tokenId === 2) { // 2 = SOL
                    equity += b.amount * solPrice;
                } else {
                    equity += b.amount * (solPrice * 0.1); // Conservative estimate for unknown
                }
            });

            // Add LP valuation to equity
            lpPositions.forEach(lp => {
                equity += lp.valuationUsdc;
            });

            equity += totalUnrealizedPnl;

            return {
                clientId: this.engine.originalClientId,
                balances,
                activePositions,
                lpPositions,
                perpOpenOrders,
                perpStats,
                totalPnl,
                totalUnrealizedPnl,
                totalRealizedPnl,
                equity
            };

        } catch (error) {
            console.error("Error fetching client data:", error);
            return null;
        }
    }


    /**
     * Get order history for a specific instrument
     */
    public async fetchOrderHistory(walletPublicKey: string, instrId: number): Promise<any[]> {
        if (!this.engine || !this.isInitialized) {
            await this.initialize();
        }

        try {
            if (!this.engine) throw new Error("Engine failed to initialize");

            // Ensure signer is set
            if (this.currentWallet !== walletPublicKey) {
                await this.engine.setSigner(address(walletPublicKey));
                this.currentWallet = walletPublicKey;
            }

            if (!this.engine.originalClientId) {
                console.log("No client ID for order history");
                return [];
            }

            const clientData = await this.engine.getClientData();
            const spotData = clientData.spot?.get(instrId);

            if (!spotData) {
                return [];
            }

            // Get order info
            const ordersInfo = await this.engine.getClientSpotOrdersInfo({
                clientId: spotData.clientId,
                instrId
            });

            if (!ordersInfo || (ordersInfo.bidsCount === 0 && ordersInfo.asksCount === 0)) {
                return [];
            }

            // Fetch actual orders
            const orders = await this.engine.getClientSpotOrders({
                instrId,
                bidsCount: ordersInfo.bidsCount,
                bidsEntry: ordersInfo.bidsEntry,
                asksCount: ordersInfo.asksCount,
                asksEntry: ordersInfo.asksEntry
            });

            const allOrders = [
                ...(orders.bids || []).map((o: any) => ({ ...o, side: 'BID' })),
                ...(orders.asks || []).map((o: any) => ({ ...o, side: 'ASK' }))
            ];

            return allOrders;

        } catch (error) {
            console.error("Error fetching order history:", error);
            return [];
        }
    }

    /**
     * Get current market price for an instrument
     */
    public async getMarketPrice(instrId: number): Promise<{ lastPx: number; bestBid: number; bestAsk: number } | null> {
        if (!this.engine || !this.isInitialized) {
            await this.initialize();
        }

        try {
            if (!this.engine) return null;

            await this.engine.updateInstrData({ instrId });
            const instr = this.engine.instruments?.get(instrId);

            if (instr) {
                return {
                    lastPx: instr.header.lastPx || 0,
                    bestBid: instr.header.bestBid || 0,
                    bestAsk: instr.header.bestAsk || 0
                };
            }
            return null;
        } catch (error) {
            console.error("Error fetching market price:", error);
            return null;
        }
    }

    /**
     * Get all available trading instruments
     */
    public async getAvailableInstruments(): Promise<Map<number, any>> {
        if (!this.engine || !this.isInitialized) {
            await this.initialize();
        }

        return this.engine?.instruments || new Map();
    }
    /**
     * Fetch trade history by parsing transaction logs
     */
    public async fetchTradeHistory(walletPublicKey: string): Promise<any[]> {
        if (!this.engine || !this.isInitialized) {
            await this.initialize();
        }

        try {
            if (!this.engine) throw new Error("Engine failed to initialize");

            // 1. Fetch recent signatures
            // Reduced limit to 10 for faster loading and stability
            const signatures = await this.rpc.getSignaturesForAddress(address(walletPublicKey), { limit: 300 }).send();

            const trades: any[] = [];

            // 2. Fetch transaction details in batches
            const rawSigs = Array.isArray(signatures) ? signatures : (signatures.value || []);
            const filteredSigs = rawSigs.map((s: any) => s.signature);
            const myClientId = this.engine.originalClientId;

            // Reduced logging - only show summary
            console.log(`[TradeHistory] Processing ${filteredSigs.length} signatures for wallet ${walletPublicKey.slice(0, 8)}...`);

            const txs: any[] = [];
            // Batch process with conservative rate limiting for public Devnet RPC
            const BATCH_SIZE = 2; // Reduced from 5 to avoid 429 errors
            for (let i = 0; i < filteredSigs.length; i += BATCH_SIZE) {
                const batch = filteredSigs.slice(i, i + BATCH_SIZE);
                const batchResults = await Promise.all(batch.map(async (sig: string) => {
                    try {
                        return await this.rpc.getTransaction(sig, {
                            maxSupportedTransactionVersion: 0,
                            commitment: 'confirmed'
                        }).send();
                    } catch (e: any) {
                        // Retry once after delay if rate limited
                        if (e.message?.includes('429') || e.context?.statusCode === 429) {
                            await new Promise(resolve => setTimeout(resolve, 1500));
                            try {
                                return await this.rpc.getTransaction(sig, {
                                    maxSupportedTransactionVersion: 0,
                                    commitment: 'confirmed'
                                }).send();
                            } catch {
                                console.warn(`Failed to fetch tx ${sig} after retry`);
                                return null;
                            }
                        }
                        console.warn(`Failed to fetch tx ${sig}:`, e.message || e);
                        return null;
                    }
                }));

                batchResults.forEach(tx => {
                    if (tx) txs.push(tx);
                });

                // Increased delay to avoid rate limiting (800ms between batches)
                await new Promise(resolve => setTimeout(resolve, 800));
            }

            // console.log(`[TradeHistory] Fetched ${txs.length} transactions`);

            // Ensure instruments are loaded for decoding
            if (!this.engine.instruments || this.engine.instruments.size === 0) {
                console.log("Instruments empty or undefined, forcing update...");
                await this.engine.initialize();
            }

            // Robust helper to safely convert BigInt/BN/String to Number
            // Handles all edge cases to prevent "Cannot mix BigInt and other types" crash
            const toSafeNumber = (val: any): number => {
                if (val === undefined || val === null) return 0;
                if (typeof val === 'number') return isNaN(val) ? 0 : val;
                if (typeof val === 'bigint') {
                    // Safely convert BigInt to Number (may lose precision for very large values)
                    try { return Number(val); } catch { return 0; }
                }
                if (typeof val === 'string') {
                    const parsed = parseFloat(val);
                    return isNaN(parsed) ? 0 : parsed;
                }
                // Handle BN.js or similar objects with toNumber method
                if (val.toNumber && typeof val.toNumber === 'function') {
                    try { return val.toNumber(); } catch { return 0; }
                }
                // Handle objects with toString method
                if (val.toString && typeof val.toString === 'function') {
                    try {
                        const parsed = parseFloat(val.toString());
                        return isNaN(parsed) ? 0 : parsed;
                    } catch { return 0; }
                }
                return 0;
            };
            // Alias for backward compatibility
            const toNumber = toSafeNumber;

            // 3. Decode logs and Reconstruct Trades
            for (const tx of txs) {
                if (!tx || !tx.meta || !tx.meta.logMessages) {
                    continue;
                }

                try {
                    // Safety wrapper for library call
                    let logs: any[] = [];
                    try {
                        logs = this.engine.logsDecode(tx.meta.logMessages);
                    } catch (decodeErr: any) {
                        console.warn(`[TradeHistory] logsDecode failed: ${decodeErr.message}`);
                        continue;
                    }
                    const sig = tx.transaction?.signatures[0];
                    const timestamp = tx.blockTime ? new Date(Number(tx.blockTime) * 1000).toISOString() : new Date().toISOString();

                    // Removed verbose per-TX logging

                    // Temporary storage for this TX
                    let myOrder: any = null;
                    let fills: any[] = [];
                    let txFees = 0;

                    for (const log of logs) {
                        const l = log as any;

                        // -- Fee Paid (Tag 15) --
                        if (toNumber(l.tag) === 15) {
                            try {
                                // console.log(`[Debug] Processing fees...`);
                                const feeVal = toNumber(l.fees);
                                // console.log(`[Debug] Fee val: ${feeVal} (type ${typeof feeVal})`);
                                txFees += feeVal;
                            } catch (err: any) {
                                console.error(`[CRASH] Error parsing fees: ${err.message}`, err);
                            }
                        }

                        // -- Deposits (Tag 1) --
                        if (toNumber(l.tag) === 1) {
                            // console.log(`[Debug] Checking Deposit Tag 1. ClientId: ${l.clientId} vs MyId: ${myClientId}`);
                            if (toNumber(l.clientId) === myClientId) {
                                try {
                                    // console.log(`[Debug] Processing Deposit Push...`);
                                    const amountVal = toNumber(l.amount);
                                    // console.log(`[Debug] Amount val: ${amountVal} (type ${typeof amountVal})`);
                                    trades.push({
                                        id: `deposit-${sig}-${trades.length}`,
                                        type: 'Deposit',
                                        side: 'LONG',
                                        symbol: toNumber(l.tokenId) === 2 ? 'SOL' : 'USDC',
                                        price: 0,
                                        size: amountVal,
                                        pnl: 0,
                                        fee: 0,
                                        timestamp,
                                        status: 'COMPLETED',
                                        section: 'Deposit',
                                        chainTx: sig
                                    });
                                } catch (err: any) {
                                    console.error(`[CRASH] Error pushing deposit: ${err.message}`, err);
                                }
                            }
                        }

                        // -- Withdrawals (Tag 2) --
                        if (toNumber(l.tag) === 2) {
                            if (toNumber(l.clientId) === myClientId) {
                                try {
                                    trades.push({
                                        id: `withdraw-${sig}-${trades.length}`,
                                        type: 'Withdraw',
                                        side: 'SHORT',
                                        symbol: toNumber(l.tokenId) === 2 ? 'SOL' : 'USDC',
                                        price: 0,
                                        size: toNumber(l.amount),
                                        pnl: 0,
                                        fee: 0,
                                        timestamp,
                                        status: 'COMPLETED',
                                        section: 'Withdraw',
                                        chainTx: sig
                                    });
                                } catch (err: any) {
                                    console.error(`[CRASH] Error pushing withdraw: ${err.message}`, err);
                                }
                            }
                        }

                        // -- Maker Fill (Tag 11) --
                        if (toNumber(l.tag) === 11 && toNumber(l.clientId) === myClientId) {
                            try {
                                trades.push({
                                    id: `fill-maker-${sig}-${l.orderId}`,
                                    type: 'Spot',
                                    side: toNumber(l.side) === 0 ? 'LONG' : 'SHORT',
                                    symbol: 'SOL/USDC',
                                    price: toNumber(l.price),
                                    size: toNumber(l.qty),
                                    pnl: 0,
                                    fee: toNumber(l.rebates),
                                    timestamp,
                                    status: 'FILLED',
                                    section: 'Spot',
                                    chainTx: sig
                                });
                            } catch (err: any) {
                                console.error(`[CRASH] Error parsing Maker Fill: ${err.message}`);
                            }
                        }

                        // -- Taker Order (Tag 10) - SPOT --
                        if (toNumber(l.tag) === 10 && toNumber(l.clientId) === myClientId) {
                            myOrder = l;
                        }

                        if (toNumber(l.tag) === 11) {
                            fills.push(l);
                        }

                        // -- Perp Deposit (Tag 3) --
                        if (toNumber(l.tag) === 3 && toNumber(l.clientId) === myClientId) {
                            try {
                                trades.push({
                                    id: `perp-deposit-${sig}-${trades.length}`,
                                    type: 'Perp Deposit',
                                    side: 'LONG',
                                    symbol: 'SOL-PERP',
                                    price: 0,
                                    size: toNumber(l.amount || l.funds),
                                    pnl: 0,
                                    fee: 0,
                                    timestamp,
                                    status: 'COMPLETED',
                                    section: 'Perp',
                                    chainTx: sig
                                });
                            } catch (err: any) {
                                console.error(`[CRASH] Error parsing Perp Deposit: ${err.message}`);
                            }
                        }

                        // -- Perp Withdraw (Tag 4) --
                        if (toNumber(l.tag) === 4 && toNumber(l.clientId) === myClientId) {
                            try {
                                trades.push({
                                    id: `perp-withdraw-${sig}-${trades.length}`,
                                    type: 'Perp Withdraw',
                                    side: 'SHORT',
                                    symbol: 'SOL-PERP',
                                    price: 0,
                                    size: toNumber(l.amount || l.funds),
                                    pnl: 0,
                                    fee: 0,
                                    timestamp,
                                    status: 'COMPLETED',
                                    section: 'Perp',
                                    chainTx: sig
                                });
                            } catch (err: any) {
                                console.error(`[CRASH] Error parsing Perp Withdraw: ${err.message}`);
                            }
                        }

                        // -- Spot Trade (Tag 7) - tokens + crncy based --
                        if (toNumber(l.tag) === 7 && toNumber(l.clientId) === myClientId) {
                            try {
                                const tokens = toNumber(l.tokens || 0);
                                const crncy = toNumber(l.crncy || 0);
                                const qty = toNumber(l.qty || 0);
                                const side = toNumber(l.side);
                                if (tokens > 0 || crncy > 0) {
                                    trades.push({
                                        id: `spot-tag7-${sig}-${l.orderId || trades.length}`,
                                        type: 'Spot',
                                        side: side === 0 ? 'LONG' : 'SHORT',
                                        symbol: 'SOL/USDC',
                                        price: tokens > 0 ? crncy / tokens : 0,
                                        size: qty || tokens,
                                        pnl: 0,
                                        fee: 0,
                                        timestamp,
                                        status: 'FILLED',
                                        section: 'Spot',
                                        chainTx: sig
                                    });
                                }
                            } catch (err: any) {
                                console.error(`[CRASH] Error parsing Spot Tag 7: ${err.message}`);
                            }
                        }

                        // -- Order Cancel (Tag 13) - skip, not a trade --

                        // -- PERP TRADE (Tag 18) - This is the main perp order tag --
                        if (toNumber(l.tag) === 18 && toNumber(l.clientId) === myClientId) {
                            try {
                                const perpSize = toNumber(l.perps || 0);
                                const perpPrice = toNumber(l.price || 0);
                                const side = toNumber(l.side);
                                if (perpSize !== 0 && perpPrice !== 0) {
                                    trades.push({
                                        id: `perp-order-${sig}-${l.orderId || trades.length}`,
                                        type: 'Perp',
                                        side: side === 0 ? 'LONG' : 'SHORT',
                                        symbol: 'SOL-PERP',
                                        price: perpPrice,
                                        size: Math.abs(perpSize),
                                        pnl: 0, // PnL calculated separately from perpStats
                                        fee: 0,
                                        timestamp,
                                        status: 'FILLED',
                                        section: 'Perp',
                                        chainTx: sig
                                    });
                                }
                            } catch (err: any) {
                                console.error(`[CRASH] Error parsing Perp Tag 18: ${err.message}`);
                            }
                        }

                        // -- Funding Payment (Tag 24) --
                        if (toNumber(l.tag) === 24 && toNumber(l.clientId) === myClientId) {
                            try {
                                const fundingAmount = toNumber(l.funding || 0);
                                if (fundingAmount !== 0) {
                                    trades.push({
                                        id: `funding-${sig}-${trades.length}`,
                                        type: 'Funding',
                                        side: fundingAmount >= 0 ? 'LONG' : 'SHORT',
                                        symbol: 'SOL-PERP',
                                        price: 0,
                                        size: Math.abs(fundingAmount),
                                        pnl: fundingAmount, // Funding is realized PnL
                                        fee: 0,
                                        timestamp,
                                        status: 'COMPLETED',
                                        section: 'Funding',
                                        chainTx: sig
                                    });
                                }
                            } catch (err: any) {
                                console.error(`[CRASH] Error parsing Funding Tag 24: ${err.message}`);
                            }
                        }

                        // -- Debug: Log unknown/unhandled tags for discovery --
                        const knownTags = [1, 2, 3, 4, 7, 10, 11, 13, 15, 18, 24];
                        const currentTag = toNumber(l.tag);
                        if (currentTag && !knownTags.includes(currentTag) && toNumber(l.clientId) === myClientId) {
                            console.log(`[TradeHistory] Unknown tag ${currentTag} found for client. Log data:`, JSON.stringify(l, (_, v) => typeof v === 'bigint' ? v.toString() : v));
                        }
                    }

                    // -- Reconstruct Taker Trade --
                    if (myOrder) {
                        try {
                            if (fills.length > 0) {
                                // Helper to calculate total value safely
                                // console.log(`[Debug] Reducing fills for ${sig}`);
                                const totalVal = fills.reduce((sum, f) => {
                                    const q = toNumber(f.qty);
                                    const p = toNumber(f.price);
                                    return sum + (q * p);
                                }, 0);

                                const totalQty = fills.reduce((sum, f) => sum + toNumber(f.qty), 0);
                                const avgPrice = totalQty > 0 ? totalVal / totalQty : 0;

                                trades.push({
                                    id: `fill-taker-${sig}-${myOrder.orderId}`,
                                    type: 'Spot',
                                    side: toNumber(myOrder.side) === 0 ? 'LONG' : 'SHORT',
                                    symbol: 'SOL/USDC',
                                    price: avgPrice,
                                    size: toNumber(myOrder.qty),
                                    pnl: 0,
                                    fee: txFees,
                                    timestamp,
                                    status: 'FILLED',
                                    section: 'Spot',
                                    chainTx: sig
                                });
                            }
                        } catch (err: any) {
                            console.error(`[CRASH] Error reconstructing Taker Trade: ${err.message}`);
                        }
                    }

                } catch (e: any) {
                    console.warn(`[OuterLoop] Failed to process tx ${tx?.transaction?.signatures?.[0] || 'unknown'}: ${e.message}`);
                    continue;
                }
            }

            console.log(`[TradeHistory] Returning ${trades.length} trades`);
            return trades;

        } catch (error) {
            console.error("Error fetching trade history:", error);
            // Return empty array instead of crashing
            return [];
        }
    }
}
