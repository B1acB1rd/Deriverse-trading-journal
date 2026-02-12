# Codebase Audit & Comparison Report

**Target Project:** `deriverse-analytics` (User's Project)
**Reference Projects Audited:**
1.  `Deriverse-TA-Dashboard` (in `others own`)
2.  `Deriverse-Trading-Analytics-Dashboard` (in `others own`)

## 1. Executive Summary

The user's project (`deriverse-analytics`) is a sophisticated application with a robust **historical data fetching engine** that outperforms the reference projects in terms of reconstructing trade history from chain data. However, the reference projects (`Deriverse-Trading-Analytics-Dashboard` specifically) contain **significantly more advanced financial metrics, risk analysis, and pattern detection algorithms** that are currently missing or simplified in the user's project.

## 2. Data Fetching & Parsing Architecture

### User's Project (`DeriverseService.ts`)
*   **Method**: fetch-and-reconstruct.
*   **Logic**:
    1.  Fetches transaction signatures (`getSignaturesForAddress`).
    2.  Batches and fetches full transaction details.
    3.  **Manually parses transaction logs** (`logsDecode`) to identify specific events:
        *   `Fees Paid` (Tag 15)
        *   `Deposits`/`Withdrawals` (Tags 1 & 2)
        *   `Maker Fill` (Tag 11) / `Taker Order` (Tag 10)
        *   `Perp Deposit`/`Withdraw` (Tags 3 & 4)
*   **Strengths**: This provides a true, immutable history of on-chain activity, including fees and exact fill prices over time. It is a "heavy" but accurate approach for historical analysis.

### Reference Project (`Deriverse-TA-Dashboard/lib/deriverse-sdk.ts`)
*   **Method**: state-snapshot & SDK-wrapper.
*   **Logic**:
    *   Primarily uses `engine.getClientData()` to get the *current* state (active positions, open orders).
    *   Does not appear to have the deep, log-parsing historical reconstruction loop found in your project.
    *   **Unique Feature Check**: It includes a "Fallout/Recovery" mechanism for finding user accounts that your project lacks.
        *   **Account Discovery Hack**: It uses `connection.getProgramAccounts` with a `memcmp` filter to find user accounts even if the standard PDA derivation fails (e.g., if the user created an account with an older program version or different seed).
        *   Code Snippet from Reference: `findRealUserAccount` uses `memcmp: { offset: 8, bytes: userPubkey }`.

## 3. Metrics & Calculations Comparison

The reference project `Deriverse-Trading-Analytics-Dashboard` (`src/lib/analytics.ts`) is far superior in statistical depth.

### PnL & Performance
| Metric | User's Project (`useTradeData`) | Reference Project (`analytics.ts`) |
| :--- | :--- | :--- |
| **PnL** | Total, Unrealized, Realized | Total, Unrealized, Daily PnL Breakdown |
| **Win Rate** | Basic (`wins / total`) | Basic (`wins / total`) |
| **Ratios** | **Missing** | **Sharpe Ratio** (Risk-adjusted return)<br>**Sortino Ratio** (Downside risk-adjusted)<br>**Profit Factor** (Gross Wins / Gross Losses)<br>**Expectancy** (Avg trade value) |
| **Drawdown** | **Missing** | **Max Drawdown** ($ and %)<br>Visual Drawdown Series |

### Risk Analysis
| Feature | User's Project | Reference Project |
| :--- | :--- | :--- |
| **Risk Score** | Basic categorical ("Low", "Medium", "High") based on Win Rate. | **Composite 0-100 Score** based on:<br>1. Leverage (lower is better)<br>2. Position Sizing Consistency (Coefficient of Variation)<br>3. Win Rate<br>4. Drawdown<br>5. Daily PnL Consistency |
| **Pattern Detection** | **"Tilt"**: Checks for outlier losses (>4x avg win).<br>**"Overtrading"**: Checks for low win rate with high volume. | **"Revenge Trading"**: Specific check for a loss followed by a re-entry on the same symbol *within 10 minutes*.<br>**"Streaks"**: Tracks winning/losing streaks >3 trades.<br>**"Performance Trend"**: Compares Win Rate of last 20 trades vs previous 20 to detect degradation. |

### Session Analysis
*   **User's Project**: Categorizes trades into 'Asian', 'London', 'NY' based on hour. Identifies "Best Session".
*   **Reference Project**: Similar logic (`computeSessionPerformance`), but also includes `HourlyPerformance` to show win rate per hour of the day (0-23).

## 4. Unique Findings in Reference Implementation

1.  **"Revenge Trade" Detection Algorithm**:
    The reference project explicitly checks for emotional re-entries:
    ```typescript
    if (prevTrade.pnl < 0 && currTrade.pnl < 0 && symbol_match && time_diff < 10_minutes) {
        // Flag as Revenge Trade
    }
    ```

2.  **Robust Account Discovery**:
    The reference uses a specific fallback to find user accounts on-chain if the standard address derivation fails.
    ```typescript
    // From Deriverse-TA-Dashboard/lib/deriverse-sdk.ts
    const accounts = await connection.getProgramAccounts(DERIVERSE_PROGRAM_ID, {
        filters: [{ memcmp: { offset: 8, bytes: userPubkey.toBase58() } }]
    });
    ```

3.  **Financial Ratios**:
    The reference implementation includes standard quant metrics (Sharpe, Sortino) which are standard for serious trading dashboards but absent in yours.

4.  **Mini-Charts / Sparklines**:
    The reference computes `pnlTrend` for each symbol to allow rendering sparklines in the UI.

## 5. Detailed Metric Definitions (Reference)

*   **Risk Score**: Calculated as `round(leverageScore * 0.2 + sizingScore * 0.15 + winRateScore * 0.25 + drawdownScore * 0.25 + consistencyScore * 0.15)`.
*   **Profit Factor**: `Gross Wins / Gross Losses`.
*   **Sharpe Ratio**: `Mean Daily Return / StdDev of Daily Returns * sqrt(252)`.
*   **Sortino Ratio**: `Mean Daily Return / Downside Deviation * sqrt(252)` (Only considers negative volatility).

## 6. Summary Recommendation

Your project has the superior **data engine** (fetching real history), but the reference projects have the superior **analytics engine** (math & metrics).

To reach parity or exceed the reference:
1.  **Adopt the "Account Discovery"** fallback to ensure you can load data for all users, even those with old accounts.
2.  **Implement the Quant Metrics**: Sharpe, Sortino, Profit Factor, and Expectancy.
3.  **Enhance Pattern Detection**: Add the time-based "Revenge Trading" check and the "Performance Trend" (Last 20 vs Prior 20) logic.
