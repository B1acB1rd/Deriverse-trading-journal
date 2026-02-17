'use client';

import React from 'react';
import {
    LayoutDashboard, BookOpen, Target, BarChart3, Settings,
    Wallet, TrendingUp, Brain, Filter, Download, Calendar,
    HelpCircle, Zap, Shield, ArrowRight, CheckCircle2
} from 'lucide-react';

interface GuideSection {
    icon: React.ElementType;
    title: string;
    description: string;
    steps: string[];
    tip?: string;
}

const GUIDE_SECTIONS: GuideSection[] = [
    {
        icon: Wallet,
        title: 'Getting Started — Connect Your Wallet',
        description: 'The platform analyzes your on-chain trading activity on the Deriverse protocol. Enter your Solana wallet address in the Settings page to begin.',
        steps: [
            'Navigate to the Settings page from the sidebar.',
            'Paste your Solana wallet address into the input field.',
            'Click "Save" — the platform will automatically fetch your trading history from the blockchain.',
            'Wait for the initial sync to complete. This may take a few minutes for accounts with many transactions.',
        ],
        tip: 'You can also use a custom RPC endpoint for faster data fetching. Add it in Settings under "RPC Configuration".',
    },
    {
        icon: LayoutDashboard,
        title: 'Command Center (Dashboard)',
        description: 'Your at-a-glance overview of portfolio performance. Shows key metrics, recent activity, and your Trader DNA profile.',
        steps: [
            'Total PnL — your cumulative profit/loss across all trades.',
            'Win Rate — percentage of trades that were profitable.',
            'Long/Short Bias — shows whether you tend to go long or short more often.',
            'Net PnL (Fees) — PnL after accounting for trading fees, giving you the true bottom line.',
            'Recent Activity — your most recent trades with journal entries.',
            'Trader DNA — AI-powered analysis of your trading personality and patterns.',
        ],
    },
    {
        icon: BookOpen,
        title: 'Trade Journal',
        description: 'Attach personal notes, reflections, and tags to each of your trades. This helps you track your mindset and decision-making process.',
        steps: [
            'Navigate to the Journal page from the sidebar.',
            'Each trade from your history appears as a card.',
            'Click on any trade to expand it and add a journal entry.',
            'Write notes about your reasoning, emotions, or market conditions.',
            'Your journal entries are saved and associated with your wallet.',
        ],
        tip: 'Consistent journaling is the #1 habit of improving traders. Even short notes like "FOMO entry" or "followed plan" are valuable.',
    },
    {
        icon: BarChart3,
        title: 'Advanced Analytics',
        description: 'Deep analysis of your trading performance across multiple dimensions. Use the filter bar at the top to slice data by time period, side, market type, or symbol.',
        steps: [
            'Quantitative Metrics — Profit Factor, Sharpe Ratio, Win Rate, Max Drawdown, and Trend analysis.',
            'Behavioral Alerts — automatic detection of revenge trading patterns and notable win/loss streaks.',
            'Daily PnL Chart — visualize your daily profit and loss over time.',
            'Long/Short Comparison — compare performance between long and short trades.',
            'Symbol Breakdown — per-asset performance analysis.',
            'Session Performance — which trading sessions (Asia, London, NY) work best for you.',
            'Fee Breakdown — understand how much you are paying in maker/taker fees.',
            'Hourly Heatmap — see which hours of the day are most profitable.',
            'PnL Attribution — breaks down what impacts your bottom line (fees, slippage, etc.).',
            'Trade History Table — full list of all trades with PnL, fees, and explorer links.',
        ],
        tip: 'Use the filter bar to focus on specific time periods or trade types. The "7D" and "30D" filters are great for tracking recent improvement.',
    },
    {
        icon: Filter,
        title: 'Using Filters',
        description: 'The analytics page has a powerful filter bar that lets you drill down into specific subsets of your data.',
        steps: [
            'Period — filter by 7 days, 30 days, 90 days, or all time.',
            'Side — show only Long trades, Short trades, or both.',
            'Market — filter by Spot or Perpetual trades.',
            'Symbol — if you trade multiple assets, filter by specific symbol.',
            'Click "Clear All" to reset all active filters.',
        ],
    },
    {
        icon: Target,
        title: 'Strategy Playbook',
        description: 'Define and track your trading setups. The Strategy Playbook has two panels: your Trader DNA profile and your custom Setup Library.',
        steps: [
            'Trader DNA (left panel) — shows your AI-analyzed trading archetype, directional bias, best session, and primary weakness.',
            'Setup Library (right panel) — create custom trading setups like "Breakout", "Range Fade", "Momentum Scalp", etc.',
            'Click the "+" button to add a new setup with a name and description.',
            'Use the trash icon to delete setups you no longer use.',
            'Your setups are saved to your wallet and persist across sessions.',
        ],
        tip: 'Naming your setups helps you categorize trades. In a future update, you will be able to tag individual trades with these setups.',
    },
    {
        icon: Brain,
        title: 'Trader DNA (AI Analysis)',
        description: 'The Trader DNA feature uses AI to analyze your trading patterns and provide a personality profile based on your actual on-chain trades.',
        steps: [
            'Archetype — a label describing your overall trading style (e.g., "Momentum Scalper", "Swing Trader").',
            'Directional Bias — whether you lean Long, Short, or Neutral.',
            'Best Session — which trading session statistically works best for you.',
            'Primary Weakness — your biggest area for improvement.',
            'Radar Chart — visual score across Win Rate, Risk Management, Timing, Patience, and Consistency.',
            'Insight — a personalized tip based on your data.',
        ],
        tip: 'The AI analysis requires at least a few trades to produce meaningful results. The more trading history available, the more accurate the profile.',
    },
    {
        icon: Download,
        title: 'Exporting Data',
        description: 'Export your trading data for further analysis or record-keeping.',
        steps: [
            'On the Analytics page, click "CSV" to download your trade history as a spreadsheet.',
            'Click "PDF" to generate a formatted performance report.',
            'Exports include all trades matching your current filters.',
        ],
    },
    {
        icon: Settings,
        title: 'Settings',
        description: 'Configure your wallet, RPC endpoint, and other preferences.',
        steps: [
            'Wallet Address — the Solana address to analyze.',
            'Custom RPC — optionally use a faster or premium RPC endpoint.',
            'Data will automatically refresh when you change wallet or RPC settings.',
        ],
    },
    {
        icon: Shield,
        title: 'Privacy & Security',
        description: 'Understanding how your data is handled.',
        steps: [
            'All data is read directly from the Solana blockchain — we do not access your private keys.',
            'Journal entries are stored in a database associated with your public wallet address.',
            'No login or account creation required — your wallet address is your identity.',
            'Trade history is cached to improve loading times on subsequent visits.',
        ],
    },
];

export default function GuidePage() {
    return (
        <div className="animate-fade-in space-y-6 md:space-y-8 max-w-4xl mx-auto">
            <div>
                <h2 className="text-xl md:text-2xl font-bold text-text-primary flex items-center gap-2">
                    <HelpCircle className="w-6 h-6 text-solana-purple" />
                    Platform Guide
                </h2>
                <p className="text-sm text-text-muted mt-1">
                    Everything you need to know about using the Deriverse Trading Journal.
                </p>
            </div>

            {/* Quick Start */}
            <div className="glass-panel p-6 rounded-2xl border border-solana-purple/30 bg-gradient-to-br from-solana-purple/5 to-transparent">
                <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-solana-purple" />
                    <h3 className="text-lg font-bold text-white">Quick Start</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { step: '1', label: 'Enter wallet in Settings', icon: Wallet },
                        { step: '2', label: 'View dashboard metrics', icon: LayoutDashboard },
                        { step: '3', label: 'Explore deep analytics', icon: BarChart3 },
                    ].map(({ step, label, icon: Icon }) => (
                        <div key={step} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl">
                            <div className="w-8 h-8 rounded-full bg-solana-purple/20 text-solana-purple flex items-center justify-center text-sm font-bold shrink-0">
                                {step}
                            </div>
                            <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-text-muted" />
                                <span className="text-sm text-text-primary">{label}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sections */}
            <div className="space-y-4">
                {GUIDE_SECTIONS.map((section, idx) => (
                    <details key={idx} className="glass-panel rounded-xl group" open={idx === 0}>
                        <summary className="cursor-pointer p-5 flex items-center gap-3 hover:bg-white/5 transition-colors rounded-xl list-none">
                            <div className="p-2 rounded-lg bg-white/5 text-solana-purple shrink-0">
                                <section.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-text-primary">{section.title}</h3>
                                <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{section.description}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-text-muted transition-transform group-open:rotate-90 shrink-0" />
                        </summary>
                        <div className="px-5 pb-5 pt-0 border-t border-glass-border">
                            <p className="text-sm text-text-secondary mt-3 mb-4">{section.description}</p>
                            <ul className="space-y-2">
                                {section.steps.map((step, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm">
                                        <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                                        <span className="text-text-secondary">{step}</span>
                                    </li>
                                ))}
                            </ul>
                            {section.tip && (
                                <div className="mt-4 p-3 bg-solana-purple/10 border border-solana-purple/20 rounded-lg">
                                    <p className="text-xs text-solana-purple flex items-start gap-2">
                                        <Zap className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                        <span><strong>Pro Tip:</strong> {section.tip}</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    </details>
                ))}
            </div>
        </div>
    );
}
