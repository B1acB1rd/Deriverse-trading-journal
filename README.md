# Deriverse Trading Analytics Dashboard

**The Next-Generation Professional Trading Journal & Analytics Platform for Deriverse (Solana).**

> 🚀 **On-Chain First**: Verifiable accuracy, unified risk analytics, and protocol-level event decoding—all designed specifically for the Deriverse ecosystem.

## 🏗️ Architecture & Data Sources

This platform follows a "Deriverse-Native" architecture, prioritizing protocol-level data over generic scraping.

### Layer 1: Data Source (Core)
- **Deriverse SDK / APIs**: The primary source of truth. We initialize the `Deriverse Engine` to stream real-time prices, account balances, and position states directly from the protocol.
- **Protocol Event Decoding**: Trade history and order lifecycle events are reconstructed by decoding on-chain program logs using the official **Deriverse SDK** (`engine.logsDecode`). This ensures 100% accuracy with the protocol's internal logic.

### Layer 2: Analytics Engine
Our custom analysis layer takes this raw protocol data to compute:
- **Trader DNA**: Algorithmic profiling of trading style (Scalper vs Swing, Risk Appetite).
- **Execution Quality**: Analyzing slippage and fee drag.
- **PnL Attribution**: distinguishing between gross trading performance and net returns after fees.

### Layer 3: On-Chain Awareness
We use standard Solana RPC endpoints (with optional Helius enhancement) only for:
- Transaction confirmation timing.
- Fetching raw transaction histories for the SDK to decode.

> **Note:** This platform checks `Deriverse` state first. It does not act as a generic Solana explorer.

---

## 📊 Core Features

### Dashboard & Analytics (Tier 1)
✅ **KPI Grid**: Total PnL, Win Rate, Trading Volume based on **real on-chain history**  
✅ **PnL Chart**: Cumulative profit curve derived from decoded trade logs  
✅ **Trader DNA Profile**: Identifies your archetype (Scalper/Swing/Position) from your actua trading behavior  
✅ **Data Integrity Panel**: Live protocol state verification  

### Professional Journaling (Tier 2)
✅ **Trade History Table**: Sortable log of all decoded Deriverse events (Deposit, Fill, Fees)  
✅ **Fee Breakdown**: Exact calculation of protocol fees vs gas fees  
✅ **Auto-Save Annotations**: Trader notes are persisted locally  

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Next.js 16 (App Router) | Enterprise React patterns |
| **Protocol** | **@deriverse/kit** | Official Protocol SDK for decoding & interaction |
| **Data** | Solana RPC + Helius (Optional) | Transaction history fetching |
| **Styling** | Tailwind CSS v4 + Vanilla CSS | Premium glassmorphism |
| **Charts** | Recharts | Responsive financial visualization |

---

## 📦 Installation & Setup

1. **Clone & Navigate**:
   ```bash
   cd deriverse-analytics
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure RPC (Optional)**:
   Create `.env.local` with your RPC URL to avoid rate limits (defaults to public devnet):
   ```env
   NEXT_PUBLIC_RPC_ENDPOINT=https://your-rpc-provider.com
   NEXT_PUBLIC_SOLANA_NETWORK=devnet
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

---

## ⚠️ Important Disclaimers

### Production Readiness
This project is currently configured for **Devnet**. To deploy live:
1. Update `NEXT_PUBLIC_DERIVERSE_PROGRAM_ID` to the specific Mainnet deployment.
2. Switch `NEXT_PUBLIC_SOLANA_NETWORK` to `mainnet-beta`.

### Not Financial Advice
This tool is **purely analytical**. Trader DNA insights and suggestions are for educational purposes only.

---

**Built for the Deriverse Hackathon 2026**
