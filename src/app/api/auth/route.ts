
import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-do-not-use-prod';

// Helper to create safe token
function createToken(wallet: string): string {
    const payload = JSON.stringify({
        wallet,
        exp: Date.now() + 24 * 60 * 60 * 1000 // 24h
    });
    const base64Payload = Buffer.from(payload).toString('base64');
    const signature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(base64Payload)
        .digest('base64')
        .replace(/\+/g, '-') // URL safe
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    return `${base64Payload}.${signature}`;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { wallet, signature, timestamp } = body;

        if (!wallet || !signature || !timestamp) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Check Timestamp (Prevent Replay)
        const now = Date.now();
        const reqTime = Number(timestamp);
        if (isNaN(reqTime) || Math.abs(now - reqTime) > 5 * 60 * 1000) { // 5 min window
            return NextResponse.json({ error: 'Request expired' }, { status: 401 });
        }

        // 2. Verify Signature
        // Message format must MATCH the frontend exactly
        const message = `Login to Deriverse Analytics\nTimestamp: ${timestamp}\nWallet: ${wallet}`;
        const messageBytes = new TextEncoder().encode(message);

        // Decode signature from base64/hex? Assuming standard array or base64
        // Usually wallets return a Uint8Array or base64 string.
        // We'll assume the frontend sends a base64 encoded string or raw array.
        // Let's standardise on base64 from frontend.
        const signatureBytes = new Uint8Array(Buffer.from(signature, 'base64'));
        const publicKeyBytes = new PublicKey(wallet).toBytes();

        const verified = nacl.sign.detached.verify(
            messageBytes,
            signatureBytes,
            publicKeyBytes
        );

        if (!verified) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // 3. Issue Token
        const token = createToken(wallet);

        return NextResponse.json({ success: true, token });

    } catch (error: any) {
        console.error('Auth Error:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
}
