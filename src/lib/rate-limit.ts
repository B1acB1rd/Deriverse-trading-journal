/**
 * In-memory rate limiter with auto-cleanup and bounded map size.
 * For production, replace with Redis-backed limiter.
 */
export class RateLimiter {
    private requests: Map<string, number[]>;
    private limit: number;
    private window: number;
    private maxKeys: number;
    private cleanupTimer: ReturnType<typeof setInterval> | null = null;

    constructor(limit: number, windowMs: number, maxKeys: number = 10000) {
        this.requests = new Map();
        this.limit = limit;
        this.window = windowMs;
        this.maxKeys = maxKeys;

        // Auto-cleanup every 60s to prevent memory leaks
        this.startCleanup();
    }

    check(key: string): boolean {
        const now = Date.now();
        const timestamps = this.requests.get(key) || [];

        // Filter out old requests
        const validTimestamps = timestamps.filter(t => now - t < this.window);

        if (validTimestamps.length >= this.limit) {
            return false;
        }

        validTimestamps.push(now);
        this.requests.set(key, validTimestamps);

        // Evict oldest keys if map exceeds max size (OOM protection)
        if (this.requests.size > this.maxKeys) {
            const keysToRemove = this.requests.size - this.maxKeys;
            const iter = this.requests.keys();
            for (let i = 0; i < keysToRemove; i++) {
                const key = iter.next().value;
                if (key) this.requests.delete(key);
            }
        }

        return true;
    }

    /** Prune expired keys to prevent memory leaks */
    cleanup() {
        const now = Date.now();
        for (const [key, timestamps] of this.requests.entries()) {
            const valid = timestamps.filter(t => now - t < this.window);
            if (valid.length === 0) {
                this.requests.delete(key);
            } else {
                this.requests.set(key, valid);
            }
        }
    }

    /** Start periodic cleanup (every 60s) */
    startCleanup() {
        if (this.cleanupTimer) return;
        this.cleanupTimer = setInterval(() => this.cleanup(), 60_000);
        // Allow process to exit even if timer is active
        if (this.cleanupTimer.unref) {
            this.cleanupTimer.unref();
        }
    }

    /** Stop periodic cleanup */
    stopCleanup() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
    }
}

// Global instances
// IP Limiter: 20 req/min (Stricter for unauth/general)
export const ipLimiter = new RateLimiter(20, 60 * 1000);

// Wallet Limiter: 60 req/min (Higher allowance for authenticated users)
export const walletLimiter = new RateLimiter(60, 60 * 1000);

// Default export for backward compatibility (using IP limiter)
export default ipLimiter;
