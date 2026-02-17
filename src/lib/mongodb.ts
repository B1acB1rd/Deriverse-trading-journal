import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

// MongoDB connection configuration
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'deriverse_analytics';

// Fail loud in production if no MongoDB URI is configured
if (IS_PRODUCTION && !MONGODB_URI) {
    throw new Error('[MongoDB] MONGODB_URI is required in production. Set it in your environment variables.');
}

const RESOLVED_URI = MONGODB_URI || 'mongodb://localhost:27017';

let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Get MongoDB client (singleton pattern)
 * Hardened: TLS in production, connection pool, retry writes, timeouts.
 */
export async function getMongoClient(): Promise<MongoClient> {
    if (!client) {
        client = new MongoClient(RESOLVED_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
            maxPoolSize: 10,
            minPoolSize: 1,
            retryWrites: true,
            retryReads: true,
            ...(IS_PRODUCTION ? { tls: true } : {}),
        });
        await client.connect();
        console.log('[MongoDB] Connected to database');
    }
    return client;
}

/**
 * Get database instance
 */
export async function getDatabase(): Promise<Db> {
    if (!db) {
        const mongoClient = await getMongoClient();
        db = mongoClient.db(DB_NAME);
    }
    return db;
}

/**
 * Close MongoDB connection
 */
export async function closeConnection(): Promise<void> {
    if (client) {
        await client.close();
        client = null;
        db = null;
        console.log('[MongoDB] Connection closed');
    }
}

// Trade document interface
export interface TradeDocument {
    _id?: ObjectId;
    walletAddress: string;
    tradeId: string;
    type: string;
    side: 'LONG' | 'SHORT';
    symbol: string;
    price: number;
    size: number;
    fees: number;
    pnl: number;
    realizedPnl: number;
    timestamp: Date;
    signature: string;
    section: string;
    createdAt: Date;
    updatedAt: Date;
}

// Account stats document interface
export interface AccountStatsDocument {
    _id?: ObjectId;
    walletAddress: string;
    totalRealizedPnl: number;
    totalFees: number;
    totalRebates: number;
    totalFunding: number;
    netPnL: number;
    tradeCount: number;
    lastUpdated: Date;
}

/**
 * Get trades collection
 */
export async function getTradesCollection(): Promise<Collection<TradeDocument>> {
    const database = await getDatabase();
    return database.collection<TradeDocument>('trades');
}

/**
 * Get account stats collection
 */
export async function getAccountStatsCollection(): Promise<Collection<AccountStatsDocument>> {
    const database = await getDatabase();
    return database.collection<AccountStatsDocument>('account_stats');
}

/**
 * Initialize MongoDB indexes
 */
export async function initializeIndexes(): Promise<void> {
    const database = await getDatabase();
    const trades = await getTradesCollection();
    const stats = await getAccountStatsCollection();
    const journal = database.collection('journal_entries');

    // Create indexes for trades (data isolation by walletAddress)
    await trades.createIndex({ walletAddress: 1, timestamp: -1 });
    await trades.createIndex({ walletAddress: 1, tradeId: 1 }, { unique: true });
    await trades.createIndex({ signature: 1 });

    // Create indexes for account stats
    await stats.createIndex({ walletAddress: 1 }, { unique: true });

    // Create indexes for journal entries (data isolation by walletAddress)
    await journal.createIndex({ walletAddress: 1, tradeId: 1 }, { unique: true });
    await journal.createIndex({ walletAddress: 1 });

    // Create indexes for trader_dna cache with TTL (auto-expire after 24h)
    const traderDna = database.collection('trader_dna');
    await traderDna.createIndex({ walletAddress: 1 }, { unique: true });
    await traderDna.createIndex({ cachedAt: 1 }, { expireAfterSeconds: 86400 });

    console.log('[MongoDB] Indexes initialized');
}
