# Architecture Overview

## System Design: Frontend + Mock Backend

The Deriverse Trading Analytics Dashboard is a **Next.js 14+ frontend** with a **simulated backend layer** that mimics real Solana on-chain data, Deriverse event streams, and ClickHouse aggregation.

### Why Mock Backend?

In production, this app would connect to:
- **Solana RPC** (to fetch transaction details)
- **Deriverse Indexer** (to stream trade/settlement events)
- **ClickHouse** (to aggregate and compute metrics at scale)

For this demo environment, we use **deterministic mock functions** in `src/data/mockData.ts` to:
- Generate realistic trade distributions
- Simulate verification snapshots with Merkle roots
- Calculate trader profiles based on heuristics
- Maintain state consistency across components

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│  UI Components (React + TypeScript + CSS Modules)           │
├─────────────────────────────────────────────────────────────┤
│  • KpiGrid, PnLChart, TraderDNACard, TradeHistoryTable      │
│  • DataIntegrityPanel, Layout, Sidebar, AppLayout           │
├─────────────────────────────────────────────────────────────┤
│  Custom Hooks & Context (Data State Management)             │
├─────────────────────────────────────────────────────────────┤
│  • useTradeData() - Provides trades, snapshots, profile      │
│  • TradeProvider (React Context)                            │
├─────────────────────────────────────────────────────────────┤
│  Business Logic & Calculations (Metrics & Heuristics)       │
├─────────────────────────────────────────────────────────────┤
│  • src/lib/metrics.ts - PnL attribution, gas savings        │
│  • src/lib/utils.ts - Format helpers                        │
│  • MEV scoring (z-score in mockData.ts)                     │
├─────────────────────────────────────────────────────────────┤
│  Mock Data & Simulation Layer                               │
├─────────────────────────────────────────────────────────────┤
│  • src/data/mockData.ts - Trade generation, snapshots       │
│  • Deterministic seeding for consistency                    │
├─────────────────────────────────────────────────────────────┤
│  Type Definitions (TypeScript Interfaces)                   │
├─────────────────────────────────────────────────────────────┤
│  • src/types/index.ts - Trade, VerificationSnapshot, etc.   │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Types & Interfaces

### Trade
```typescript
export interface Trade {
    id: string;
    wallet: string;
    symbol: string; // 'SOL-PERP', 'BTC-PERP', etc.
    side: 'LONG' | 'SHORT';
    orderType: 'MARKET' | 'LIMIT' | 'STOP_MARKET' | 'STOP_LIMIT';
    price: number;
    size: number; // USD notional
    // Execution details
    fees: number;
    slippage: number;
    pnl: number; // Net PnL = gross - fees - slippage
    realizedPnl: number;
    unrealizedPnl: number;
    timestamp: string; // ISO
    isOnChain: boolean;
    chainTx?: string; // Solana tx signature
    liquidityTier: 'HIGH' | 'MEDIUM' | 'LOW';
    // Journaling & MEV
    notes?: string;
    tags?: string[];
    isMEVSuspect: boolean;
    mevConfidence?: number; // [0, 1] - z-score based
}
```

### VerificationSnapshot
```typescript
export interface VerificationSnapshot {
    id: string;
    date: string; // ISO date
    tradeCount: number;
    merkleRoot: string; // Mock Merkle root hash
    status: 'simulated' | 'verified';
    timestamp: string;
}
```

### TraderProfile
```typescript
export interface TraderProfile {
    style: 'Scalper' | 'Swing' | 'Position';
    bias: 'Long' | 'Short' | 'Balanced';
    bestSession: string; // e.g., "NY Open", "Asia"
    risk: 'High' | 'Medium' | 'Low';
    weakness: string; // e.g., "Overtrading"
}
```

### PnLAttribution
```typescript
export interface PnLAttribution {
    grossPnL: number;
    feesPaid: number;
    slippageLoss: number;
    netPnL: number;
}
```

---

## Metric Calculations

### 1. MEV Confidence Scoring

**Algorithm:** Z-score–based slippage anomaly detection

1. Maintain a rolling window of recent slippage values (last 12 trades).
2. For each new trade, compute:
   - Mean μ = average slippage in window
   - Std Dev σ = standard deviation
   - Z-score z = (current_slippage - μ) / σ
3. Convert z-score to confidence using smooth sigmoid:
   - mevConfidence = tanh(z / 2), clamped [0, 1]
4. Flag trade as MEV-suspect if:
   - mevConfidence > 0.6 AND trade resulted in loss

**Interpretation:**
- High confidence (>0.6): Slippage is significantly above recent average, and loss was incurred. **High risk of MEV extraction.**
- Medium (0.3–0.6): Suspicious slippage but inconclusive (either no loss or marginal).
- Low (<0.3): Slippage within expected range.

### 2. PnL Attribution

**Formula:**
```
grossPnL = sum of all pnl values before execution costs
feesPaid = sum of all fee amounts (per-trade)
slippageLoss = sum of all slippage costs (per-trade)
netPnL = grossPnL - feesPaid - slippageLoss
```

**Purpose:** Breaks down net trading profit into:
- **Gross** = alpha/edge (what you earned from trades)
- **Fees** = cost of trading on DEX (5 bps on Deriverse)
- **Slippage** = cost of market impact / execution quality
- **Net** = actual realized profit

### 3. Gasless Savings

**Formula:**
```
gasSavings = (baselinePerTrade × tradeCount) - totalFeesPaid
```

**Baseline:** Estimated cost per trade on L1 (e.g., $20 on Ethereum Mainnet for a swap).

**Purpose:** Highlights Deriverse efficiency: lower gas (Solana native + optimized Rust) → more profit in pocket.

---

## Data Flow

1. **Init:** `useTradeData()` hook mounts → calls `generateMockTrades(50)` and `generateSnapshots()`.
2. **State:** Trades and snapshots stored in React Context (`TradeContext`).
3. **Components subscribe:** `KpiGrid`, `PnLChart`, `TraderDNACard`, etc. read from context.
4. **Render:** Each component computes derived metrics (e.g., `calculatePnLAttribution()`) and renders.
5. **Interactivity:** User filters, expands rows, enters notes → state updates locally (no backend call).

---

## Production Migration Path

To move from mock → real:

1. **Replace `generateMockTrades()`** → Query Solana Devnet/Mainnet RPC for user's Deriverse transactions.
2. **Replace `generateSnapshots()`** → Poll Deriverse Indexer for on-chain verification events.
3. **Add real MEV detection** → Integrate MEV detection service (e.g., MEV-Inspect, Flashbots API).
4. **Add ClickHouse aggregation** → Compute PnL attribution, Trader DNA, and other KPIs server-side for scale.
5. **Add authentication** → Wallet connection (Phantom, Solflare) + signed messages.
6. **Add persistence** → Save user notes, tags, and settings to a database (PostgreSQL + Hasura, or Firebase).

---

## Styling & Theme

- **Framework:** Vanilla CSS with CSS Modules
- **Theme:** Dark mode (deep space palette: #0B0B0F background, #7C3AED primary violet, #06B6D4 cyan accents)
- **Glassmorphism:** 16px backdrop blur + 8% border opacity for premium feel
- **Animations:** 150ms–300ms transitions for smooth state changes
- **Responsive:** Mobile-first design with breakpoints at 768px (tablet) and 1024px (desktop)

---

## File Structure

```
deriverse-analytics/
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout + sidebar
│   │   ├── page.tsx             # Home / dashboard page
│   │   ├── globals.css          # Global theme & styles
│   │   ├── page.module.css      # Page-specific styles
│   │   ├── analytics/
│   │   │   └── page.tsx         # Analytics page
│   │   ├── journal/
│   │   │   └── page.tsx         # Journal page
│   │   └── strategies/
│   │       └── page.tsx         # Strategies page
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.module.css
│   │   ├── dashboard/
│   │   │   ├── KpiGrid.tsx
│   │   │   ├── PnLChart.tsx
│   │   │   ├── TraderDNACard.tsx
│   │   │   └── DataIntegrityPanel.tsx
│   │   ├── journal/
│   │   │   └── TradeHistoryTable.tsx
│   │   ├── analytics/
│   │   │   ├── LiquidityHeatmap.tsx
│   │   │   └── PnLAttributionChart.tsx
│   │   └── strategies/
│   │       └── StrategySnapshotCard.tsx
│   ├── hooks/
│   │   └── useTradeData.tsx     # Context provider & hook
│   ├── lib/
│   │   ├── metrics.ts           # PnL attribution, gas savings
│   │   └── utils.ts             # Format helpers
│   ├── data/
│   │   └── mockData.ts          # Mock trade generation
│   └── types/
│       └── index.ts             # TypeScript interfaces
├── scripts/
│   └── verify_metrics.ts        # Automated metric validation
├── public/                      # Static assets
├── FEATURE_MATRIX.md            # Feature checklist
├── ARCHITECTURE.md              # This file
├── LIMITATIONS.md               # Disclaimers
├── README.md                    # Setup & usage
├── package.json
├── tsconfig.json
├── next.config.ts
└── eslint.config.mjs
```

---

## Testing & Verification

Run the metric verification script:

```bash
npx ts-node scripts/verify_metrics.ts
```

**Checks:**
- Net PnL attribution sums correctly
- Gas savings calculation is non-negative
- All trades have valid mevConfidence in [0, 1]

---

## Next Steps

1. **Real Data:** Replace mock functions with Solana RPC / Deriverse Indexer queries.
2. **MEV Service:** Integrate real MEV detection (e.g., via Helius MEV API).
3. **Database:** Add persistence for user notes, tags, and settings.
4. **Analytics:** Extend KPIs (Sharpe ratio, max drawdown, Calmar ratio, etc.).
5. **Export:** Add PDF/CSV export of trade journal and snapshots.
