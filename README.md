<p align="center">
  <h1 align="center">📊 Deriverse Analytics</h1>
  <p align="center">
    <strong>Professional-grade trading journal and analytics dashboard for the Deriverse DEX on Solana</strong>
  </p>
  <p align="center">
    <a href="#features">Features</a> · <a href="#quickstart">Quickstart</a> · <a href="#architecture">Architecture</a> · <a href="#configuration">Configuration</a>
  </p>
</p>

---

## Overview

Deriverse Analytics is a full-stack Next.js application that connects to your Solana wallet, fetches your complete trading history from the Deriverse protocol, and provides institutional-grade analytics, journaling, and performance tracking — all in a premium dark-mode interface.

### What It Does

- **On-chain data engine** — Parses raw Solana transaction logs to reconstruct your full trade history (fills, liquidations, funding, deposits, withdrawals)
- **Incremental sync** — Only fetches new trades since your last session, using blockchain signatures for instant subsequent loads
- **Trade journal** — Calendar heatmap + list view with per-trade annotations (strategy, psychology, notes, discipline score)
- **Quant metrics** — Sharpe Ratio, Sortino Ratio, Profit Factor, Expectancy, Max Drawdown, and Performance Trend analysis
- **Behavioral analysis** — Detects revenge trading patterns, tracks win/loss streaks, and identifies performance trends
- **MongoDB persistence** — Trade data and journal entries persist across devices via MongoDB Atlas (optional — works with localStorage alone)

---

## Features

### 📈 Dashboard
| Feature | Description |
|---|---|
| Portfolio Overview | Real-time balance, equity, and PnL from on-chain data |
| Active Positions | Live Spot & Perp positions with mark prices |
| Recent Trades | Latest 5 trades with PnL at a glance |
| Account Stats | Win rate, total trades, best/worst trade |

### 📓 Trade Journal
| Feature | Description |
|---|---|
| Dual View | Toggle between list view and calendar heatmap |
| Smart Filters | Filter by side (Long/Short), result (Winners/Losers), and date range |
| Per-Trade Annotations | Strategy tags, emotion tracking, notes, discipline scoring |
| Calendar Heatmap | Daily PnL color-coded cells with win/loss breakdowns |
| Mobile Responsive | Fully functional on phones and tablets |

### 🧮 Advanced Analytics
| Metric | Description |
|---|---|
| Sharpe Ratio | Risk-adjusted return (annualized, √252) |
| Sortino Ratio | Downside-only risk adjustment |
| Profit Factor | Gross wins / gross losses |
| Expectancy | Average dollar value per trade |
| Max Drawdown | Peak-to-trough decline ($ and %) |
| Performance Trend | Last 20 vs prior 20 trades comparison |

### 🧠 Behavioral Alerts
| Alert | Trigger |
|---|---|
| Revenge Trading | Same-symbol re-entry within 10 min of a loss |
| Winning Streak | 3+ consecutive profitable trades |
| Losing Streak | 3+ consecutive losing trades |

### ⚙️ Settings
- **Custom RPC** — Use your own Helius/QuickNode endpoint for faster loads (optional, app works without it)
- **Export Journal** — Download all journal entries as JSON
- **Force Refresh** — Full on-chain resync
- **Clear Local Data** — Wipe localStorage journal entries

---

## Quickstart

### Prerequisites
- **Node.js** ≥ 18
- **npm** or **yarn**
- A **Solana wallet** (Phantom, Solflare, etc.)

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
| `NEXT_PUBLIC_RPC_ENDPOINT` | No | `https://api.devnet.solana.com` | Solana RPC endpoint |
| `NEXT_PUBLIC_DERIVERSE_PROGRAM_ID` | No | `Drvrseg8AQLP8...` | Deriverse program address |
| `NEXT_PUBLIC_DERIVERSE_VERSION` | No | `12` | Protocol version |
| `NEXT_PUBLIC_TOKEN_MINT_A` | No | Devnet mint A | Token A mint address |
| `NEXT_PUBLIC_TOKEN_MINT_B` | No | Devnet mint B | Token B mint address |
| `MONGODB_URI` | No | — | MongoDB Atlas connection string |
| `MONGODB_DB_NAME` | No | `deriverse_analytics` | Database name |
| `GEMINI_API_KEY` | No | — | Google Gemini API key for Trader DNA |

> **Note:** The app works without MongoDB — it uses localStorage as fallback. MongoDB enables cross-device persistence.

---

## Architecture

```
deriverse-analytics/
├── src/
│   ├── app/                    # Next.js pages & API routes
│   │   ├── api/
│   │   │   ├── deriverse/      # Main data API (trades, positions)
│   │   │   ├── journal/        # Journal entry CRUD
│   │   │   └── trader-dna/     # AI analysis endpoint
│   │   ├── analytics/          # Quant metrics + charts
│   │   ├── calendar/           # Calendar heatmap page
│   │   ├── dashboard/          # Main dashboard
│   │   ├── journal/            # Trade logbook
│   │   ├── settings/           # App configuration
│   │   └── strategies/         # Strategy management
│   ├── components/             # Reusable UI components
│   ├── hooks/                  # React hooks (useTradeData, useJournalData)
│   ├── lib/                    # Utilities, DB, metrics
│   │   ├── AccountStorage.ts   # MongoDB trade persistence
│   │   ├── metrics.ts          # Quant metrics (Sharpe, Sortino, etc.)
│   │   ├── mongodb.ts          # Database connection & schemas
│   │   └── utils.ts            # Formatting helpers
│   ├── services/
│   │   └── DeriverseService.ts # On-chain data fetching engine
│   └── types/                  # TypeScript interfaces
```

### Data Flow

```
Solana RPC → DeriverseService (tx parsing) → API Route → MongoDB (persist) → Client
                                                                    ↓
                                                           localStorage (fallback)
```

### Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Animations:** Framer Motion
- **Blockchain:** @solana/kit, @deriverse/kit
- **Database:** MongoDB Atlas (optional)
- **AI:** Google Gemini (optional, for Trader DNA)
- **Deployment:** Vercel

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in [Vercel](https://vercel.com/new)
3. Set environment variables in Vercel dashboard
4. Deploy — the app auto-builds and deploys on every push

### Manual Build

```bash
npm run build
npm start
```

---

## License

MIT

---

<p align="center">
  Built for traders, by traders. 🏴‍☠️
</p>
