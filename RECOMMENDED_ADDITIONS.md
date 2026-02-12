# Recommended Additions & Features

Based on the audit of reference projects (`Deriverse-TA-Dashboard`, etc.), the following features are recommended for integration into `deriverse-analytics` to bring it to a professional standard.

## 1. 🚨 Critical Infrastructure (High Priority)

### Account Discovery Fallback
**Why:** Currently, if a user's Deriverse account address cannot be derived via the standard method (e.g., they used an older program version or seed), your app may fail to load their data.
**What to Add:**
- Implement a fallback search using `connection.getProgramAccounts` with a memory comparison filter (`memcmp`) to find any account owned by the user's wallet, regardless of how it was derived.
- **Reference:** `Deriverse-TA-Dashboard/lib/deriverse-sdk.ts` (function `findRealUserAccount`).

---

## 2. 📊 Advanced Financial Metrics

**Why:** Your current dashboard shows basic PnL and Win Rate. Professional traders need risk-adjusted metrics to evaluate strategy performance.
**What to Add:**

### Quant Ratios
- **Sharpe Ratio:** Measures return relative to risk (volatility). High Sharpe = consistent profits.
- **Sortino Ratio:** Similar to Sharpe but only penalizes *downside* volatility (losing trades).
- **Profit Factor:** `Gross Winning Trades ($) / Gross Losing Trades ($)`. A value > 1.5 is generally considered good.
- **Expectancy:** The average dollar value you can expect from each trade.

### Session Analysis
- **Hourly Integrity:** Breakdown win rate and PnL by hour of day (0-23) to identify best trading times.
- **Sparklines:** Small trend charts for each symbol in the dashboard list to show PnL trajectory at a glance.

---

## 3. 🛡️ Risk & Behavioral Analysis

**Why:** To help traders improve, the app needs to identify *bad habits*, not just bad results.
**What to Add:**

### "Revenge Trading" Detection
- **Logic:** Flag a trade if it opens within X minutes (e.g., 10 mins) of a *losing* trade on the *same symbol* and *also loses*.
- **UI:** Show a "Revenge Trade Warning" badge on these specific trade details.

### "Tilt" & Streak Tracking
- **Streaks:** Identify consecutive wins/losses greater than 3.
- **Tilt Detection:** Flag losses that are significantly larger (e.g., >3x) than the average loss, indicating loss of emotional control.

### Composite Risk Score (0-100)
- Create a single "Health Score" for the account based on:
    1.  **Leverage usage** (lower is better).
    2.  **Consistency** (stable position sizes are better).
    3.  **Drawdown** (lower max drawdown is better).
    4.  **Win Rate**.

---

## 4. 📈 Performance Trends

**Why:** A trader wants to know if they are improving or getting worse *recently*.
**What to Add:**

### Recent vs. Historical Comparison
- Compare metrics (Win Rate, Avg PnL) of the **Last 20 Trades** vs. the **Previous 20 Trades**.
- Display an indicator: "Improving", "Stable", or "Declining".
