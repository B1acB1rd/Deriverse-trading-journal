# Deriverse Analytics

A professional trading journal and analytics dashboard for the [Deriverse](https://deriverse.io) decentralized exchange on Solana Devnet.

## How It Works

Deriverse Analytics connects directly to the Solana blockchain to read your on-chain trading activity from the Deriverse DEX. It then presents this data in an interactive dashboard with PnL tracking, trade history, analytics charts, and an AI-powered trader personality analysis.

**Data flow:**
1. You connect your Solana wallet address
2. The app reads your Deriverse account data from Solana Devnet (positions, balances, trade history)
3. Trades are optionally cached in MongoDB Atlas for faster loading
4. You can annotate trades in the Journal with notes, emotions, and strategy tags
5. The Trader DNA feature uses Google Gemini AI to analyze your trading patterns

**No wallet connection required** — the app is read-only and only needs your public wallet address.

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+ 
- npm

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Copy the example env file:
```bash
cp .env.example .env.local
```

The default values in `.env.example` work out of the box for Deriverse Devnet. MongoDB and Gemini AI are **optional** — the app works without them.

### 3. Run the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and enter a Deriverse wallet address.

---

## Deploy to Vercel

### Step 1: Push to GitHub
```bash
git add .
git commit -m "deploy"
git push origin main
```

### Step 2: Import to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Framework preset: **Next.js** (auto-detected)
4. Click **Deploy**

### Step 3: Set Environment Variables
In Vercel → Your Project → **Settings** → **Environment Variables**, add:

| Variable | Required | Value |
|----------|----------|-------|
| `NEXT_PUBLIC_RPC_ENDPOINT` | Yes | `https://api.devnet.solana.com` |
| `NEXT_PUBLIC_DERIVERSE_PROGRAM_ID` | Yes | `Drvrseg8AQLP8B96DBGmHRjFGviFNYTkHueY9g3k27Gu` |
| `NEXT_PUBLIC_DERIVERSE_VERSION` | Yes | `12` |
| `NEXT_PUBLIC_TOKEN_MINT_A` | Yes | `9pan9bMn5HatX4EJdBwg9VgCa7Uz5HL8N1m5D3NdXejP` |
| `NEXT_PUBLIC_TOKEN_MINT_B` | Yes | `A2Pz6rVyXuadFkKnhMXd1w9xgSrZd8m8sEGpuGuyFhaj` |
| `MONGODB_URI` | Optional | Your MongoDB Atlas connection string |
| `MONGODB_DB_NAME` | Optional | `deriverse_analytics` |
| `GEMINI_API_KEY` | Optional | Your Google Gemini API key |

After adding variables, click **Redeploy** from the Deployments tab.

---

## MongoDB Atlas Setup (Optional)

MongoDB is used to cache trade history and persist journal entries across sessions. **The app works without it** — trades are fetched directly from the blockchain each time, and journal entries are stored in your browser's localStorage.

### If You Already Have a Cluster

You can reuse your existing Atlas cluster. MongoDB stores data in separate **databases** within a cluster, so your other application's data stays untouched.

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Click your cluster (e.g., **Cluster0**)
3. Click **Connect** → **Drivers** → **Node.js** (version 6.7+)
4. Copy the connection string. It looks like:
   ```
   mongodb+srv://b1acb1rd:<db_password>@cluster0.ppldy1e.mongodb.net/?appName=Cluster0
   ```
5. **Replace `<db_password>`** with your actual database user password
6. Add `&retryWrites=true&w=majority` to the end:
   ```
   mongodb+srv://b1acb1rd:YOUR_ACTUAL_PASSWORD@cluster0.ppldy1e.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```

### Important: Network Access
Your cluster must allow connections from Vercel's servers:
1. In Atlas sidebar → **Network Access**
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** (adds `0.0.0.0/0`)
4. Click **Confirm**

### Important: Database User
Make sure you have a database user with read/write access:
1. In Atlas sidebar → **Database Access**
2. Verify your user exists and has **readWriteAnyDatabase** role
3. If you forgot the password, click **Edit** → **Edit Password** → set a new one

### Set the Environment Variable
- **Locally**: Add to `.env.local`:
  ```
  MONGODB_URI=mongodb+srv://b1acb1rd:YOUR_PASSWORD@cluster0.ppldy1e.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
  MONGODB_DB_NAME=deriverse_analytics
  ```
- **Vercel**: Add `MONGODB_URI` and `MONGODB_DB_NAME` in Settings → Environment Variables

The `MONGODB_DB_NAME=deriverse_analytics` creates a **new database** called `deriverse_analytics` inside your cluster — it does NOT affect your other databases.

---

## Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | Overview with balance, PnL, win rate, and KPI cards |
| **Trade History** | Full table of all on-chain trades with filters |
| **Analytics** | Charts for drawdown, PnL over time, long/short ratio |
| **Journal** | Annotate trades with notes, emotions, strategy, and discipline scores |
| **Strategies** | Define and track trading strategies |
| **Calendar** | Heat map view of daily trading performance |
| **Trader DNA** | AI-powered analysis of your trading personality (requires Gemini API key) |
| **MongoDB Cache** | Faster loading with optional trade persistence |

## Project Structure

```
deriverse-analytics/
├── src/
│   ├── app/                 # Next.js pages & API routes
│   │   ├── api/
│   │   │   ├── deriverse/   # Fetches on-chain trade data
│   │   │   ├── journal/     # Journal CRUD (MongoDB)
│   │   │   └── trader-dna/  # AI analysis (Gemini)
│   │   ├── dashboard/       # Main dashboard page
│   │   ├── analytics/       # Analytics charts
│   │   ├── journal/         # Trade journal
│   │   ├── strategies/      # Strategy management
│   │   ├── calendar/        # Performance calendar
│   │   └── settings/        # App settings
│   ├── components/          # React UI components
│   ├── hooks/               # Data fetching hooks
│   ├── lib/                 # MongoDB, PnL calculations, metrics
│   └── services/            # Deriverse SDK integration
├── .env.example             # Environment template
├── package.json
└── README.md
```

## Tech Stack

- **Framework**: Next.js 16, React 19, TypeScript
- **Styling**: TailwindCSS 4, Framer Motion
- **Charts**: Recharts
- **Database**: MongoDB Atlas (optional)
- **Blockchain**: @solana/web3.js, @deriverse/kit
- **AI**: Google Gemini

## License

MIT

---

**Built for the Deriverse Hackathon 2026**
