import { Trade, SymbolMetrics, PortfolioMetrics } from '@/types';
import { formatCurrency, formatPercentage } from '@/lib/utils';

/**
 * Export utilities for trading data — CSV & PDF
 * Phase 6: Enhanced with portfolio metrics and PDF generation.
 */

/**
 * Convert trades array to CSV string (enhanced with v2 analytics fields)
 */
export function tradesToCSV(trades: Trade[]): string {
    const headers = [
        'Date',
        'Time',
        'Symbol',
        'Side',
        'Market Type',
        'Order Type',
        'Entry Price',
        'Exit Price',
        'Size',
        'Volume',
        'PnL',
        'Realized PnL',
        'Fees',
        'Duration (s)',
        'Status',
        'Strategy',
        'Notes',
        'TX Signature',
    ];

    const rows = trades.map(trade => {
        const d = new Date(trade.timestamp);
        const date = d.toISOString().split('T')[0];
        const time = d.toISOString().split('T')[1].split('.')[0];
        const volume = (trade.price || 0) * (trade.size || 0);

        return [
            date,
            time,
            trade.symbol,
            trade.side,
            trade.marketType || '',
            trade.orderType,
            (trade.entryPrice || trade.price || 0).toFixed(4),
            (trade.exitPrice || 0).toFixed(4),
            (trade.size || 0).toFixed(6),
            volume.toFixed(2),
            (trade.pnl || 0).toFixed(4),
            (trade.realizedPnl || 0).toFixed(4),
            (trade.fees || 0).toFixed(4),
            (trade.duration || 0).toString(),
            trade.status || '',
            trade.strategyId || '',
            trade.notes || '',
            trade.chainTx || '',
        ];
    });

    return [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');
}

/**
 * Convert symbol metrics to CSV string
 */
export function metricsToCSV(symbolMetrics: SymbolMetrics[]): string {
    const sections: string[] = [];

    sections.push('SYMBOL PERFORMANCE');
    sections.push('Symbol,PnL,Volume,Trades,Win Rate %,Avg PnL,Fees');

    symbolMetrics.forEach(s => {
        sections.push(
            `${s.symbol},${s.pnl.toFixed(2)},${s.volume.toFixed(2)},${s.tradeCount},${s.winRate.toFixed(2)},${s.averagePnl.toFixed(2)},${s.fees.toFixed(4)}`
        );
    });

    return sections.join('\n');
}

/**
 * Generate a full portfolio report as CSV including metrics summary
 */
export function portfolioReportToCSV(trades: Trade[], metrics: PortfolioMetrics): string {
    const sections: string[] = [];

    // Portfolio Summary
    sections.push('PORTFOLIO SUMMARY');
    sections.push('Metric,Value');
    sections.push(`Total PnL,${formatCurrency(metrics.totalPnl)}`);
    sections.push(`Total Volume,${formatCurrency(metrics.totalVolume)}`);
    sections.push(`Total Fees,${formatCurrency(metrics.totalFees)}`);
    sections.push(`Win Rate,${(metrics.winRate * 100).toFixed(1)}%`);
    sections.push(`Total Trades,${metrics.totalTrades}`);
    sections.push(`Winning Trades,${metrics.winningTrades}`);
    sections.push(`Losing Trades,${metrics.losingTrades}`);
    sections.push(`Average Win,${formatCurrency(metrics.averageWin)}`);
    sections.push(`Average Loss,${formatCurrency(metrics.averageLoss)}`);
    sections.push(`Largest Win,${formatCurrency(metrics.largestWin)}`);
    sections.push(`Largest Loss,${formatCurrency(metrics.largestLoss)}`);
    sections.push(`Profit Factor,${metrics.profitFactor.toFixed(2)}`);
    sections.push(`Max Drawdown,${formatCurrency(metrics.maxDrawdown)}`);
    sections.push(`L/S Ratio,${metrics.longShortRatio.toFixed(2)}`);
    if (metrics.sharpeRatio !== undefined) {
        sections.push(`Sharpe Ratio,${metrics.sharpeRatio.toFixed(2)}`);
    }
    sections.push('');
    sections.push('');

    // Trade Data
    sections.push(tradesToCSV(trades));

    return sections.join('\n');
}

/**
 * Generate a printable HTML report and trigger browser print (PDF)
 */
export function exportToPDF(trades: Trade[], metrics: PortfolioMetrics): void {
    const date = new Date().toISOString().split('T')[0];

    const winnerTrades = trades.filter(t => t.pnl > 0);
    const loserTrades = trades.filter(t => t.pnl < 0);

    const tradeRows = trades
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 50) // Limit to 50 most recent
        .map(t => {
            const d = new Date(t.timestamp);
            const pnlColor = t.pnl >= 0 ? '#34d399' : '#f87171';
            return `<tr>
                <td>${d.toLocaleDateString()}</td>
                <td>${t.symbol}</td>
                <td style="color: ${t.side === 'LONG' ? '#34d399' : '#f87171'}">${t.side}</td>
                <td>$${(t.entryPrice || t.price || 0).toFixed(2)}</td>
                <td>$${(t.exitPrice || 0).toFixed(2)}</td>
                <td style="color: ${pnlColor}; font-weight: bold;">${t.pnl >= 0 ? '+' : ''}$${t.pnl.toFixed(2)}</td>
                <td>$${Math.abs(t.fees).toFixed(4)}</td>
            </tr>`;
        }).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
    <title>Deriverse Trading Report — ${date}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #0b0f19; color: #e2e8f0; padding: 32px; }
        .header { text-align: center; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 1px solid #1e293b; }
        .header h1 { font-size: 24px; color: #818cf8; margin-bottom: 4px; }
        .header p { font-size: 12px; color: #64748b; }
        .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 32px; }
        .metric-card { background: #111827; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; }
        .metric-card .label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .metric-card .value { font-size: 20px; font-weight: 700; margin-top: 4px; font-variant-numeric: tabular-nums; }
        .metric-card .sub { font-size: 10px; color: #475569; margin-top: 2px; }
        .green { color: #34d399; }
        .red { color: #f87171; }
        .white { color: #e2e8f0; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { text-align: left; padding: 8px 12px; color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #1e293b; }
        td { padding: 8px 12px; border-bottom: 1px solid #111827; font-variant-numeric: tabular-nums; }
        .section-title { font-size: 14px; font-weight: 600; color: #94a3b8; margin-bottom: 12px; margin-top: 24px; }
        @media print {
            body { background: white; color: #1e293b; padding: 16px; }
            .metric-card { background: #f8fafc; border-color: #e2e8f0; }
            th { color: #475569; border-bottom-color: #e2e8f0; }
            td { border-bottom-color: #f1f5f9; }
            .green { color: #059669; }
            .red { color: #dc2626; }
            .white { color: #1e293b; }
            .header h1 { color: #4338ca; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Deriverse Trading Report</h1>
        <p>Generated on ${date} · ${trades.length} trades analyzed</p>
    </div>

    <div class="metrics-grid">
        <div class="metric-card">
            <div class="label">Total PnL</div>
            <div class="value ${metrics.totalPnl >= 0 ? 'green' : 'red'}">${metrics.totalPnl >= 0 ? '+' : ''}$${metrics.totalPnl.toFixed(2)}</div>
        </div>
        <div class="metric-card">
            <div class="label">Win Rate</div>
            <div class="value white">${(metrics.winRate * 100).toFixed(1)}%</div>
            <div class="sub">${metrics.winningTrades}W / ${metrics.losingTrades}L</div>
        </div>
        <div class="metric-card">
            <div class="label">Profit Factor</div>
            <div class="value ${metrics.profitFactor >= 1 ? 'green' : 'red'}">${metrics.profitFactor.toFixed(2)}</div>
        </div>
        <div class="metric-card">
            <div class="label">Max Drawdown</div>
            <div class="value red">$${Math.abs(metrics.maxDrawdown).toFixed(2)}</div>
        </div>
        <div class="metric-card">
            <div class="label">Total Volume</div>
            <div class="value white">$${metrics.totalVolume.toFixed(2)}</div>
        </div>
        <div class="metric-card">
            <div class="label">Total Fees</div>
            <div class="value red">$${Math.abs(metrics.totalFees).toFixed(4)}</div>
        </div>
        <div class="metric-card">
            <div class="label">Avg Win</div>
            <div class="value green">$${metrics.averageWin.toFixed(2)}</div>
        </div>
        <div class="metric-card">
            <div class="label">Avg Loss</div>
            <div class="value red">$${metrics.averageLoss.toFixed(2)}</div>
        </div>
    </div>

    <div class="section-title">Recent Trades (Last 50)</div>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Symbol</th>
                <th>Side</th>
                <th>Entry</th>
                <th>Exit</th>
                <th>PnL</th>
                <th>Fees</th>
            </tr>
        </thead>
        <tbody>
            ${tradeRows}
        </tbody>
    </table>
</body>
</html>`;

    const printWindow = window.open('', '_blank')!;
    printWindow.document.write(html);
    printWindow.document.close();
    // Auto-trigger print dialog after rendering
    printWindow.onload = () => {
        printWindow.print();
    };
}

/**
 * Trigger a file download in the browser
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Export trades to CSV file
 */
export function exportTradesToCSV(trades: Trade[], filename?: string): void {
    const csv = tradesToCSV(trades);
    const date = new Date().toISOString().split('T')[0];
    downloadFile(csv, filename || `deriverse-trades-${date}.csv`, 'text/csv;charset=utf-8');
}

/**
 * Export symbol metrics to CSV file
 */
export function exportMetricsToCSV(symbolMetrics: SymbolMetrics[], filename?: string): void {
    const csv = metricsToCSV(symbolMetrics);
    const date = new Date().toISOString().split('T')[0];
    downloadFile(csv, filename || `deriverse-metrics-${date}.csv`, 'text/csv;charset=utf-8');
}

/**
 * Export full portfolio report (metrics + trades) as CSV
 */
export function exportPortfolioReport(trades: Trade[], metrics: PortfolioMetrics, filename?: string): void {
    const csv = portfolioReportToCSV(trades, metrics);
    const date = new Date().toISOString().split('T')[0];
    downloadFile(csv, filename || `deriverse-portfolio-report-${date}.csv`, 'text/csv;charset=utf-8');
}
