# Deriverse Analytics

A professional trading journal and analytics dashboard for the [Deriverse](https://deriverse.io) decentralized exchange on Solana.

## Features

| Feature | Status |
|---------|--------|
| Total PnL Tracking | ✅ |
| Win Rate Statistics | ✅ |
| Volume & Fee Analysis | ✅ |
| Trade Duration | ✅ |
| Long/Short Ratio | ✅ |
| Largest Gain/Loss | ✅ |
| Trade History Table | ✅ |
| Drawdown Chart | ✅ |
| Order Type Analysis | ✅ |
| Trader DNA (AI) | ✅ |
| MongoDB Persistence | ✅ |
| Journal Annotations | ✅ |

## Project Structure

```
deriverse-analytics/
├── backend/                 # Express API Server
│   ├── src/
│   │   └── index.ts         # API entry point
│   ├── package.json
│   └── .env.example
├── src/                     # Next.js Frontend
│   ├── app/                 # Pages & API routes
│   │   ├── api/             # Next.js API (works standalone)
│   │   │   ├── deriverse/   # Trade data
│   │   │   ├── journal/     # Journal CRUD
│   │   │   └── trader-dna/  # AI analysis
│   │   ├── analytics/       # Analytics page
│   │   ├── journal/         # Journal page
│   │   └── page.tsx         # Dashboard
│   ├── components/          # React components
│   ├── hooks/               # Data fetching
│   ├── lib/                 # MongoDB, utilities
│   └── services/            # Deriverse SDK integration
├── .env.example             # Environment template
├── package.json             # Frontend dependencies
└── README.md
```

## Deriverse Configuration

This platform uses **Deriverse Devnet**:

| Parameter | Value |
|-----------|-------|
| Program ID | `Drvrseg8AQLP8B96DBGmHRjFGviFNYTkHueY9g3k27Gu` |
| Token A | `9pan9bMn5HatX4EJdBwg9VgCa7Uz5HL8N1m5D3NdXejP` |
| Token B | `A2Pz6rVyXuadFkKnhMXd1w9xgSrZd8m8sEGpuGuyFhaj` |

## Quick Start

### Frontend (Next.js)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Backend (Express) - Optional

```bash
cd backend
npm install
npm run dev
```

API runs on [http://localhost:4000](http://localhost:4000)

## Environment Variables

Create `.env.local` in root:

```env
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
NEXT_PUBLIC_DERIVERSE_PROGRAM_ID=Drvrseg8AQLP8B96DBGmHRjFGviFNYTkHueY9g3k27Gu
NEXT_PUBLIC_DERIVERSE_VERSION=12
NEXT_PUBLIC_TOKEN_MINT_A=9pan9bMn5HatX4EJdBwg9VgCa7Uz5HL8N1m5D3NdXejP
NEXT_PUBLIC_TOKEN_MINT_B=A2Pz6rVyXuadFkKnhMXd1w9xgSrZd8m8sEGpuGuyFhaj

# Optional: MongoDB for persistence
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=deriverse_analytics

# Optional: Gemini AI for Trader DNA
GEMINI_API_KEY=your-key
```

## Deploy

### Vercel (Frontend)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/B1acB1rd/Deriverse-trading-journal)

### Render (Backend)

1. Create new Web Service
2. Connect GitHub repo
3. Set root directory to `backend`
4. Build command: `npm install && npm run build`
5. Start command: `npm start`

## Tech Stack

- **Frontend**: Next.js 14, TailwindCSS, Recharts
- **Backend**: Express, TypeScript
- **Database**: MongoDB Atlas
- **Blockchain**: @solana/web3.js, @deriverse/kit
- **AI**: Google Gemini

## License

MIT

---

**Built for the Deriverse Hackathon 2026**
