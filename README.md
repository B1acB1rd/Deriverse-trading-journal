<p align="center">
  <img src="public/logo.ico" alt="Deriverse Logo" width="80" />
  <h1 align="center">Deriverse Trading Journal</h1>
  <p align="center">
    <strong>Professional-grade trading journal and analytics platform for the Deriverse DEX on Solana</strong>
  </p>
  <p align="center">
    <a href="#features">Features</a> · <a href="#quickstart">Quickstart</a> · <a href="#architecture">Architecture</a> · <a href="#security">Security</a> · <a href="#deployment">Deployment</a>
  </p>
</p>

---

## Overview

Deriverse Trading Journal is a full-stack Next.js application that connects to your Solana wallet, fetches your complete trading history from the **Deriverse protocol (Version 12)**, and provides institutional-grade analytics, journaling, and performance tracking — all in a premium dark-mode interface.

### What It Does

| Capability | Description |
|---|---|
| **On-Chain Data Engine** | Parses raw Solana transaction logs to reconstruct full trade history — fills, funding payments, deposits, and withdrawals |
| **FIFO PnL Calculator** | Matches buys against sells in first-in-first-out order with accurate gross/net PnL, supporting both Long and Short positions |
| **Incremental Sync** | Only fetches new transactions since your last session using blockchain signatures for instant subsequent loads |
| **Trade Journal** | Calendar heatmap + list view with per-trade annotations (strategy tags, psychology notes, discipline scoring) |
| **Quantitative Metrics** | Sharpe Ratio, Sortino Ratio, Profit Factor, Expectancy, Max Drawdown, and Performance Trend analysis |
| **Behavioral Analysis** | Automatic detection of revenge trading patterns, win/loss streaks, and performance trends |
| **AI Trader DNA** | Google Gemini–powered personality profiling based on real on-chain trading patterns |
| **MongoDB Persistence** | Trade data and journal entries persist across devices via MongoDB Atlas (falls back to localStorage) |

---

## Features

### 📊 Command Center (Dashboard)

- **KPI Grid** — Total PnL, Win Rate, Long/Short Bias, Net PnL (after fees) with sparkline charts
- **Assets Overview** — Real-time token balances from on-chain data
- **Recent Activity** — Latest trades with journal entries at a glance
- **Trader DNA** — AI-powered radar chart profiling your trading personality
- **Projections** — Forward-looking performance estimates
- **Data Integrity** — Shows sync status and data quality metrics

### 📓 Trade Journal

- **Dual View** — Toggle between chronological list and calendar heatmap
- **Smart Filters** — Filter by side (Long/Short), result (Winners/Losers), and date range
- **Per-Trade Annotations** — Strategy tags, emotion tracking, notes, and discipline scoring
- **Calendar Heatmap** — Daily PnL color-coded cells with win/loss breakdowns
- **Mobile Responsive** — Fully functional on all screen sizes

### 🧮 Advanced Analytics

| Metric | Description |
|---|---|
| Profit Factor | Gross wins / gross losses |
| Sharpe Ratio | Risk-adjusted return (annualized, √252) |
| Sortino Ratio | Downside-only risk adjustment |
| Win Rate | Percentage of profitable trades |
| Max Drawdown | Peak-to-trough decline ($ and %) |
| Performance Trend | Last 20 vs prior 20 trades comparison |

**Charts & Visualizations:**
- Daily PnL Chart — bar chart of daily performance
- Long/Short Comparison — side-by-side performance analysis
- Symbol Breakdown — per-asset performance table
- Session Performance — Asia, London, NY session analysis
- Fee Breakdown — maker/taker fee analysis
- Hourly Heatmap — profitability by hour of day
- PnL Attribution — gross → net breakdown (fees, slippage)
- Drawdown Chart — visual drawdown timeseries
- Psychology Chart — emotional pattern analysis

### 🧠 Behavioral Alerts

| Alert | Trigger |
|---|---|
| Revenge Trading | Same-symbol re-entry within 10 min of a loss |
| Winning Streak | 3+ consecutive profitable trades |
| Losing Streak | 3+ consecutive losing trades |

### 🎯 Strategy Playbook

- **Trader DNA** — AI analysis showing archetype, directional bias, best session, and primary weakness
- **Setup Library** — Create, edit, and delete custom trading setups (no hardcoded defaults)
- **Persistent Storage** — Strategies are saved per-wallet in MongoDB

### 📖 Guide Page

- Comprehensive in-app documentation covering every feature
- Quick-start walkthrough for new users
- Collapsible sections with pro tips
- Accessible from the sidebar navigation

### ⚙️ Settings

- **Wallet Address** — Configure which wallet to analyze
- **Custom RPC** — Use a premium endpoint (Helius, QuickNode) for faster loads
- **Export** — Download trade data as CSV or PDF reports
- **Force Refresh** — Full on-chain resync

---

## Quickstart

### Prerequisites

- **Node.js** ≥ 18
- **npm** or **yarn**
- A **Solana wallet** with Deriverse trading history

### Installation

```bash
# Clone the repository
git clone https://github.com/B1acB1rd/Deriverse-trading-journal.git
cd Deriverse-trading-journal

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_DERIVERSE_PROGRAM_ID` | No | `Drvrseg8AQLP8...` | Deriverse program address (V12) |
| `NEXT_PUBLIC_DERIVERSE_VERSION` | No | `12` | Protocol version |
| `NEXT_PUBLIC_TOKEN_MINT_A` | No | Devnet mint A | Token A mint address |
| `NEXT_PUBLIC_TOKEN_MINT_B` | No | Devnet mint B | Token B mint address |
| `NEXT_PUBLIC_RPC_ENDPOINT` | No | `https://api.devnet.solana.com` | Solana RPC endpoint |
| `NEXT_PUBLIC_SOLANA_NETWORK` | No | `devnet` | Network (devnet / mainnet-beta) |
| `MONGODB_URI` | No | — | MongoDB Atlas connection string |
| `MONGODB_DB_NAME` | No | `deriverse_analytics` | Database name |
| `GEMINI_API_KEY` | No | — | Google Gemini API key for Trader DNA |

> **Note:** The app works without MongoDB — all data falls back to localStorage. MongoDB enables cross-device persistence and faster loads.

---

## Architecture

```
deriverse-analytics/
├── src/
│   ├── app/                    # Next.js App Router pages & API routes
│   │   ├── api/
│   │   │   ├── deriverse/      # Main data API (trades, balances)
│   │   │   ├── journal/        # Journal entry CRUD
│   │   │   ├── trader-dna/     # AI analysis endpoint
│   │   │   └── strategies/     # Strategy CRUD
│   │   ├── analytics/          # Quant metrics + charts page
│   │   ├── dashboard/          # Command center
│   │   ├── guide/              # Platform documentation
│   │   ├── journal/            # Trade logbook
│   │   ├── settings/           # App configuration
│   │   └── strategies/         # Strategy playbook
│   ├── components/             # Reusable UI components
│   │   ├── analytics/          # Chart components (11 visualizations)
│   │   ├── dashboard/          # KPI, trade table, DNA card, etc.
│   │   ├── common/             # Shared components (FilterBar, DateRange)
│   │   ├── layout/             # Sidebar, MainLayout
│   │   └── strategies/         # SetupLibrary
│   ├── hooks/                  # React hooks (useTradeData, useJournalData)
│   ├── lib/                    # Core utilities
│   │   ├── pnl.ts              # FIFO PnL calculator
│   │   ├── metrics.ts          # Quantitative metrics engine
│   │   ├── AccountStorage.ts   # MongoDB trade persistence
│   │   ├── mongodb.ts          # Database connection & schemas
│   │   ├── rate-limit.ts       # API rate limiting
│   │   └── utils.ts            # Formatting helpers
│   ├── services/
│   │   └── DeriverseService.ts # On-chain data fetching & parsing engine
│   ├── store/                  # Zustand state management
│   └── tests/                  # PnL calculation tests
```

### Data Flow

```
Solana RPC → DeriverseService (tx log parsing) → API Route → MongoDB (persist) → Client
                                                                      ↓
                                                             localStorage (fallback)
```

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 |
| State | Zustand |
| Charts | Recharts |
| Animations | Framer Motion |
| Blockchain | @solana/kit, @deriverse/kit |
| Database | MongoDB Atlas |
| AI | Google Gemini |
| Tables | TanStack React Table |
| Deployment | Vercel |

---

## Security

The platform includes production-grade security hardening:

- **SSRF Protection** — Custom RPC URLs are validated to block private IPs, localhost, and non-HTTPS endpoints
- **Rate Limiting** — IP-based rate limiting (20 req/min) on all API routes with automatic cleanup and bounded memory
- **Input Validation** — Wallet addresses are validated on all write endpoints
- **Database Hardening** — TLS in production, connection pooling, retry logic, and TTL indexes for cache expiry
- **Error Handling** — No silent error swallowing; all errors are logged with context

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in [Vercel](https://vercel.com/new)
3. Set environment variables in the Vercel dashboard
4. Deploy — auto-builds on every push

### Manual Build

```bash
npm run build
npm start
```

---

## Version Compatibility

This platform is built for **Deriverse Protocol Version 12**. To use with a different version, update the following in `.env.local`:

```env
NEXT_PUBLIC_DERIVERSE_PROGRAM_ID=<program_address>
NEXT_PUBLIC_DERIVERSE_VERSION=<version_number>
NEXT_PUBLIC_TOKEN_MINT_A=<token_a_mint>
NEXT_PUBLIC_TOKEN_MINT_B=<token_b_mint>
```

---

## License

MIT

---

<p align="center">
  Built by B1ACB1RD 🏴‍☠️
</p>
