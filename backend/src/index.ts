import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Deriverse API - fetches trade data
app.get('/api/deriverse', async (req: Request, res: Response) => {
    const wallet = req.query.wallet as string;
    if (!wallet) {
        return res.status(400).json({ error: 'Wallet required' });
    }
    // Forward to Next.js API or implement here
    res.json({ success: true, message: 'Use Next.js API at /api/deriverse' });
});

// Journal API
app.get('/api/journal', async (req: Request, res: Response) => {
    res.json({ success: true, entries: {} });
});

app.post('/api/journal', async (req: Request, res: Response) => {
    res.json({ success: true });
});

// Trader DNA API
app.post('/api/trader-dna', async (req: Request, res: Response) => {
    res.json({ success: true, dna: null });
});

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});

export default app;
