import { Trade, SymbolMetrics } from '@/types';

/**
 * Export utilities for trading data — CSV format
 * Adapted from reference project's export.ts but using our Trade type.
 */

/**
 * Convert trades array to CSV string
 */
export function tradesToCSV(trades: Trade[]): string {
    const headers = [
        'Date',
        'Time',
        'Symbol',
        'Side',
        'Type',
        'Order Type',
        'Price',
        'Size',
        'Volume',
        'PnL',
        'Realized PnL',
        'Fees',
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
            trade.positionType || '',
            trade.orderType,
            (trade.price || 0).toFixed(4),
            (trade.size || 0).toFixed(6),
            volume.toFixed(2),
            (trade.pnl || 0).toFixed(4),
            (trade.realizedPnl || 0).toFixed(4),
            (trade.fees || 0).toFixed(4),
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
