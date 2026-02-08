# Deriverse Analytics Platform

**A professional-grade trading journal and analytics suite for the Deriverse SOL ecosystem.**

> 🚀 **Real Data Only**: This platform is built on a "Verify, Don't Trust" philosophy. It connects directly to the Solana blockchain to decode Deriverse protocol events. **No mock data is used.**

---

## 🌟 Key Features

### 1. Advanced Trading Dashboard
- **Real-Time PnL**: Tracks realized and unrealized profit/loss directly from on-chain positions.
- **Performance Metrics**: Win Rate, Long/Short Bias, Sharpe Ratio approximations.
- **Visual Analytics**: Interactive charts for Cumulative PnL, Drawdown, and Asset Allocation.

### 2. Smart Trade Journal (MongoDB Persisted)
- **Automatic Sync**: Trades are fetched from the blockchain and synced to a MongoDB database.
- **Rich Annotations**: Add notes, tags, and emotional states to every trade.
- **Persistent Storage**: Unlike local-only solutions, your journal data is safely stored in the cloud (MongoDB Atlas), accessible across devices.

### 3. Trader DNA (Powered by Gemini AI)
- **AI Analysis**: Uses Google's Gemini AI to analyze your trading history and generate a psychological profile (e.g., "Disciplined Swing Trader" or "Impulsive Scalper").
- **Algorithmic Fallback**: Robust statistical analysis provides insights even if AI services are unavailable.
- **Strengths & Weaknesses**: Identifies patterns in your trading behavior to help you improve.

### 4. Deep Analytics
- **PnL Attribution**: Breaks down your results into Gross PnL, Fees Paid, and Slippage impact.
- **Order Type Analysis**: Compares performance between Market and Limit orders.
- **Psychology Chart**: Correlates your emotional state (e.g., "Confident", "Anxious") with trade outcomes.

---

## 🏗️ Architecture

The platform is built using a modern Next.js 14 stack, aimed at performance and scalability.

```mermaid
graph TD
    User[User Browser] <--> Frontend[Next.js App Router]
    Frontend <--> API[Next.js API Routes]
    
    subgraph "Data Layer"
        API <--> Mongo[MongoDB Atlas]
        API <--> RPC[Solana RPC]
        API <--> Gemini[Google Gemini AI]
    end

    subgraph "Protocol"
        RPC <--> Deriverse[Deriverse Smart Contracts]
    end
```

### Core Components
- **Frontend**: React, TailwindCSS, Recharts.
- **Backend API**: Next.js Server Actions & API Routes (`/api/deriverse`, `/api/journal`, `/api/trader-dna`).
- **Database**: MongoDB (via `mongoose`) for caching trades and storing user journal entries.
- **Blockchain Integration**: `@deriverse/kit` & `@solana/web3.js` for fetching and decoding instruction logs.

### Data Flow
1. **Fetch**: The application queries Solana RPC for transaction signatures associated with your wallet.
2. **Decode**: It uses the Deriverse SDK to decode binary instruction data into readable trade events (Open, Close, Liquidate).
3. **Cache**: Validated trades are stored in MongoDB to reduce RPC calls and enable fast historical analysis.
4. **Analyze**: The backend aggregators (and Gemini AI) process this data to generate insights.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Connection String (Atlas or Local)
- Google Gemini API Key (Optional, for AI features)
- Solana RPC URL (Optional, uses public endpoints by default)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-repo/deriverse-analytics.git
   cd deriverse-analytics
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env.local` file in the root directory:
   ```env
   # Database (Required for Journal & Caching)
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
   MONGODB_DB_NAME=deriverse_analytics

   # AI Analysis (Optional)
   GEMINI_API_KEY=your_gemini_api_key

   # Blockchain (Optional)
   NEXT_PUBLIC_RPC_ENDPOINT=https://api.mainnet-beta.solana.com
   ```

4. **Run Locally:**
   ```bash
   npm run dev
   ```
   Access the app at `http://localhost:3000`.

---

## 📦 Deployment

This project supports two deployment models. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Option 1: Unified (Recommended)
Deploy the entire app (Frontend + API) to **Vercel** or a Docker container. This is the simplest approach.

### Option 2: Decoupled
Deploy the API routes as a standalone backend service (e.g., on Railway/Render) and the frontend as a static site. Useful for scaling components independently.

---

## 🧪 Verification

To ensure data accuracy, run the verification suite (if implemented) or check the **Data Integrity** panel in the dashboard.

- **No Mock Data**: All charts and metrics are calculated from `src/hooks/useTradeData.tsx` which consumes the real API.
- **Calculation Audit**: All metrics (PnL, Fees, Volume) have been audited for FIFO accuracy.

---

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**Built with ❤️ for the Deriverse Community.**
