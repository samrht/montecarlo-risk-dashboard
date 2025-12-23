# Monte Carlo Portfolio Risk & Goal Feasibility Dashboard

A browser-based quantitative finance system that evaluates long-term financial goal feasibility, downside risk, and plan robustness under uncertain market conditions using Monte Carlo simulation.

This project replaces deterministic financial calculators with a **probabilistic, risk-aware framework** that models thousands of possible futures and converts uncertainty into actionable decisions.

---

## Why This Project Exists

Most financial planning tools assume:

- Fixed annual returns  
- No volatility or tail risk  
- No correlation across assets  
- No behavioral or contribution constraints  

These assumptions produce **systematically optimistic forecasts** and hide the true risk of failure.

This project treats financial planning as a **stochastic decision problem**, not a spreadsheet exercise.

---

## What the System Answers

Instead of asking:

> “What will my portfolio be worth?”

It answers:

- What is the **probability** of reaching my goal?
- How bad can outcomes get in the worst cases?
- How fragile is my plan if assumptions are wrong?
- What concrete actions improve success probability?

---

## Core Features

### Monte Carlo Simulation Engine

- Thousands of independent market paths  
- Fully client-side execution using Web Workers  
- Deterministic output under fixed random seeds  
- Non-blocking UI even at large simulation counts  

---

### Stochastic Return Modeling

- Normal and Student-t return distributions  
- Fat-tail modeling for crash risk  
- Correlated asset returns via covariance matrices  
- Annual → monthly parameter conversion  

---

### Goal Feasibility Analysis

- Inflation-adjusted future target  
- Probability of success and failure  
- Terminal wealth distribution  
- Quantile-based decision metrics  

---

### Downside Risk Metrics

- Value at Risk (VaR)  
- Conditional Value at Risk (CVaR)  
- Maximum drawdown per path  
- Worst-case percentile summaries  

---

### Actionable Recommendation Engine

Instead of passive outputs, the system **solves inverse problems**.

It computes:

- Required SIP for 70%, 80%, and 90% success
- Whether a goal is fundamentally unreachable
- Trade-offs between saving more vs delaying goals

Example output:

> **“To reach 80% success, increase SIP by ₹6,000  
> or delay the goal by 2 years.”**

---

### Robustness Assessment

A single score answering:

> **“How fragile is this plan if assumptions are wrong?”**

Method:

- Expected returns ↓  
- Volatility ↑  
- Correlations ↑  
- Simulations re-run in worker  

Classification:

- 🟢 Robust  
- 🟡 Sensitive  
- 🔴 Fragile  

---

### Stress Testing & Scenario Analysis

- Custom stress tests (return haircut + volatility multiplier)  
- Base vs stress delta tables  
- Downside risk comparison  

---

### Interactive Dashboard

- Distribution histograms  
- Scenario comparison tables  
- Goal finder (inverse quantile lookup)  
- PDF export of results  

---

This system models long-term financial planning as a **stochastic process under uncertainty**, rather than a deterministic projection. All results are derived from probability distributions, simulated paths, and quantile-based decision metrics.

---

### 1. Stochastic Asset Returns

Each asset *i* is modeled as a random variable rather than a fixed return:

rᵢ ~ D( μᵢ , σᵢ )

markdown


Where:

- μᵢ = expected annual return  
- σᵢ = annual volatility  
- D = Normal or Student-t distribution  

Student-t distributions are used to capture **fat tails** and crash risk:

rᵢ ~ t( μᵢ , σᵢ , ν )




where ν is the degrees of freedom controlling tail thickness.

---

### 2. Time Scaling (Annual → Monthly)

All simulations operate at monthly resolution.

Expected return scaling:

μᵢ(monthly) = μᵢ / 12

bash


Volatility scaling (square-root of time):

σᵢ(monthly) = σᵢ / √12




This preserves variance consistency across time scales.

---

### 3. Correlated Returns

Asset returns are not independent. Correlation is introduced using a correlation matrix **Σ**:

Rₜ = L · Zₜ




Where:

- Zₜ = vector of independent standard normal (or t) variables  
- L = Cholesky decomposition of Σ  

This produces correlated asset returns consistent with empirical markets.

---

### 4. Portfolio Return Construction

Portfolio return at time *t*:

Rₜ = Σ ( wᵢ · rᵢ,ₜ )




Where:

- wᵢ = normalized asset weight  
- Σ wᵢ = 1  

Weights auto-normalize to ensure portfolio consistency.

---

### 5. Wealth Evolution Equation

Portfolio value evolves as:

Vₜ₊₁ = ( Vₜ + Cₜ ) · ( 1 + Rₜ )




Where:

- Vₜ = portfolio value at time t  
- Cₜ = contributions at time t (SIP + lump sum)  
- Rₜ = portfolio return  

Contribution constraints include:

- SIP caps as % of income  
- Absolute monthly contribution limits  

---

### 6. Inflation-Adjusted Target

The future value of the goal is inflation-adjusted:

Goal_future = Goal_today · ( 1 + π )ᵀ




Where:

- π = annual inflation rate  
- T = investment horizon (years)  

This ensures comparisons are made in **real purchasing power terms**.

---

### 7. Monte Carlo Simulation

The system generates **N independent simulation paths**:

{ V_T¹ , V_T² , … , V_Tᴺ }




Each path represents one plausible market future.

---

### 8. Probability of Success

Success is defined as reaching or exceeding the target:

P(success) = |{ V_T ≥ Goal_future }| / N




Failure probability:

P(failure) = 1 − P(success)




---

### 9. Value at Risk (VaR)

Value at Risk at confidence level α:

VaRₐ = Qₐ( V_T )




Where Qₐ is the α-quantile of terminal wealth.

This answers:

> “What is the worst outcome in the bottom α% of cases?”

---

### 10. Conditional Value at Risk (CVaR)

CVaR measures **average loss beyond VaR**:

CVaRₐ = E[ V_T | V_T ≤ VaRₐ ]




This captures **tail severity**, not just threshold risk.

---

### 11. Maximum Drawdown

For each simulation path:

MDD = max_t ( Peak_t − Trough_t ) / Peak_t




This measures behavioral risk and worst-case portfolio pain.

---

### 12. Inverse Monte Carlo Optimization

To find required SIP for a target success probability *p*:

1. Adjust SIP value  
2. Re-run Monte Carlo  
3. Measure P(success)  
4. Binary search until:

P(success) ≈ p




This converts probabilistic outputs into **actionable financial decisions**.

---

### 13. Robustness Analysis

Model assumptions are deliberately stressed:

- μ decreased  
- σ increased  
- correlations increased  

Robustness score:

Drop = P_base − P_stressed




Classification:

- 🟢 Robust: Drop < 5%  
- 🟡 Sensitive: 5%–15%  
- 🔴 Fragile: >15%  

This measures **model fragility under assumption error**.

---

### 14. Interpretation Philosophy

All metrics are:

- Distribution-based  
- Quantile-driven  
- Explicitly probabilistic  

The system avoids point forecasts and instead focuses on **risk, uncertainty, and decision quality**.


## Limitations & Assumptions

This system is intentionally transparent about its assumptions. The results are **probabilistic estimates**, not guarantees.

### Key Assumptions

- Asset returns are **stationary** over the simulation horizon  
- Volatility and correlations are **time-invariant** within each run  
- Returns follow **Normal or Student-t** distributions  
- Contributions occur at fixed monthly intervals  
- No taxes, transaction costs, or liquidity constraints are modeled  

These assumptions are standard in quantitative finance but may not hold in all real-world conditions.

### Known Limitations

- No regime-switching or dynamic volatility modeling  
- No behavioral changes beyond contribution constraints  
- Correlations do not evolve endogenously  
- Extreme tail events beyond modeled fat tails are possible  

The system prioritizes **clarity and robustness over false precision**.

---

## Use Cases & Example Decisions

This tool is designed for **decision-making under uncertainty**, not forecasting.

### Example Questions It Answers

- “Is my current savings plan realistically sufficient?”
- “How much do I need to increase my SIP to reach 80% success?”
- “Should I save more or delay the goal?”
- “How fragile is this plan if returns disappoint?”
- “What happens under a 2008-style environment?”

### Example Output

> **“To reach 80% success, increase SIP by ₹6,000 per month  
> or delay the goal by 2 years.”**

This converts uncertainty into **clear, actionable guidance**.

---

## Future Extensions

This project is intentionally extensible. Possible future upgrades include:

### Modeling Enhancements

- Regime-switching returns (bull / bear markets)  
- Time-varying volatility (GARCH-style models)  
- Transaction costs and tax drag  
- Glide-path asset allocation  

### Decision Intelligence

- Behavioral risk profiling  
- Panic thresholds tied to drawdowns  
- Goal prioritization across multiple objectives  

### Data Integration

- Historical return estimation from rolling windows  
- Live market data ingestion  
- Empirical correlation estimation  

---

## Technology Stack

### Frontend

- **React** – UI framework  
- **TypeScript** – Type safety and correctness  
- **Vite** – Fast build and development tooling  
- **Tailwind CSS** – Utility-first styling  

### Computation

- **Custom Monte Carlo engine**  
- **Web Workers** for non-blocking computation  
- Deterministic PRNG with seed control  

### Visualization & Export

- **Recharts** – Distribution and risk visualization  
- **html2canvas + jsPDF** – Dashboard PDF export  

---

## Disclaimer

This project is intended for **educational and analytical purposes only**.

- It does not constitute financial advice  
- It does not recommend specific investments  
- All outputs are probabilistic, not guaranteed  

Users should consult qualified financial professionals before making real-world financial decisions.

---

## Summary

This system demonstrates:

- Probabilistic reasoning under uncertainty  
- Monte Carlo simulation at scale  
- Risk-aware financial decision modeling  
- Full-stack engineering with numerical rigor  

It bridges **quantitative finance, software engineering, and decision science** in a single, cohesive application.


For each asset *i*:

