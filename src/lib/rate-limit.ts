export class RateLimiter {
    private requests: Map<string, number[]>;
    private limit: number;
    private window: number;

    constructor(limit: number, windowMs: number) {
        this.requests = new Map();
        this.limit = limit;
        this.window = windowMs;
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
        return true;
    }

    // Optional: Prune old keys to prevent memory leaks in long-running processes
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
}

// Global instances
// IP Limiter: 20 req/min (Stricter for unauth/general)
export const ipLimiter = new RateLimiter(20, 60 * 1000);

// Wallet Limiter: 60 req/min (Higher allowance for authenticated users)
export const walletLimiter = new RateLimiter(60, 60 * 1000);

// Default export for backward compatibility (using IP limiter)
export default ipLimiter;
