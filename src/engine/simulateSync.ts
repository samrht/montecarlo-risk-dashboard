/**
 * simulateSync.ts
 *
 * Synchronous Monte Carlo — mirrors compute.ts exactly so that
 * ActionEngine and RobustnessBox produce results consistent with
 * the main simulation run.
 *
 * Supports:
 *  - Weight normalization
 *  - Cholesky-decomposed correlated returns
 *  - Normal and Student-t return distributions
 *  - SIP caps (income % and absolute)
 *  - Rebalancing (monthly / quarterly / annual / none)
 *  - TER fee drag
 */

import type { Config, Results } from "./types";
import {
  annualToMonthly,
  cholesky,
  cvarLower,
  matVec,
  normalizeWeights,
  percentile,
  percentiles,
  randChiSquare,
  randn,
} from "./math";

/* ---------- helpers ---------- */

function identity(n: number): number[][] {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );
}

function maxDrawdown(path: number[]): number {
  let peak = path[0];
  let mdd = 0;
  for (const v of path) {
    if (v > peak) peak = v;
    const dd = (v - peak) / peak;
    if (dd < mdd) mdd = dd;
  }
  return mdd; // negative fraction, e.g. -0.3 = -30%
}

/* ---------- synchronous Monte Carlo ---------- */

export function runMonteCarloSync(cfg: Config): Results {
  const months = Math.max(1, Math.floor(cfg.years * 12));
  const n = cfg.assets.length;
  if (n < 1) throw new Error("Add at least one asset.");

  // Normalize weights
  const w = normalizeWeights(cfg.assets.map((a) => a.weight));

  // Correlation / Cholesky
  const corr =
    cfg.corr && cfg.corr.length === n ? cfg.corr : identity(n);
  const L = cholesky(corr);

  // Effective SIP after contribution caps
  let sipEff = cfg.sipMonthly;
  if (typeof cfg.incomeMonthly === "number") {
    sipEff = Math.min(sipEff, cfg.sipCapPct * cfg.incomeMonthly);
  }
  if (typeof cfg.contribCapMonthly === "number") {
    sipEff = Math.min(sipEff, cfg.contribCapMonthly);
  }

  // Inflation-adjusted goal
  const goalFuture =
    cfg.goalToday * Math.pow(1 + cfg.inflationAnnual, cfg.years);

  // Monthly TER fee multiplier
  const feeM = Math.pow(1 - cfg.terAnnual, 1 / 12) - 1;

  // Rebalance cadence
  const rebalanceEvery =
    cfg.rebalanceFreq === "none"
      ? null
      : cfg.rebalanceFreq === "monthly"
      ? 1
      : cfg.rebalanceFreq === "quarterly"
      ? 3
      : 12; // annual

  // Use Math.random() as the PRNG for the sync path (no seed needed —
  // workers/action engine runs are exploratory, not display-critical)
  const rand = Math.random.bind(Math);

  const terminal: number[] = [];
  const mdd: number[] = [];
  const samplePaths: number[][] = [];
  const keepPaths = 25;
  let successCount = 0;

  for (let s = 0; s < cfg.nSims; s++) {
    let holdings = w.map((wi) => cfg.lumpSum * wi);

    const path: number[] = new Array(months + 1);
    path[0] = holdings.reduce((a, b) => a + b, 0);

    for (let t = 1; t <= months; t++) {
      // Add SIP contribution proportional to weights
      for (let i = 0; i < n; i++) holdings[i] += sipEff * w[i];

      // Correlated standard-normal draws
      const z = Array.from({ length: n }, () => randn(rand));
      const zc = matVec(L, z);

      // Student-t scaling
      let scale = 1;
      if (cfg.model === "t") {
        const df = Math.max(2, Math.floor(cfg.df));
        const chi = randChiSquare(rand, df);
        scale = Math.sqrt(df / (chi || 1e-12));
      }

      // Apply returns to each asset holding
      for (let i = 0; i < n; i++) {
        const { muM, sigmaM } = annualToMonthly(
          cfg.assets[i].muAnnual,
          cfg.assets[i].sigmaAnnual
        );
        const r = muM + sigmaM * zc[i] * scale;
        holdings[i] *= 1 + r;
      }

      // Rebalance if due
      if (rebalanceEvery && t % rebalanceEvery === 0) {
        const total = holdings.reduce((a, b) => a + b, 0);
        holdings = w.map((wi) => total * wi);
      }

      // Apply TER fee drag
      const totalBeforeFee = holdings.reduce((a, b) => a + b, 0);
      const totalAfterFee = totalBeforeFee * (1 + feeM);
      const k = totalBeforeFee > 0 ? totalAfterFee / totalBeforeFee : 1;
      for (let i = 0; i < n; i++) holdings[i] *= k;

      path[t] = totalAfterFee;
    }

    const term = path[months];
    terminal.push(term);
    if (term >= goalFuture) successCount++;

    mdd.push(maxDrawdown(path));

    if (s < keepPaths) samplePaths.push(path);
  }

  const pSuccess = successCount / cfg.nSims;
  const pFail = 1 - pSuccess;

  const var5 = percentile(terminal, 5);
  const var1 = percentile(terminal, 1);
  const cvar5 = cvarLower(terminal, 0.05);
  const shortfall5 = Math.max(0, goalFuture - var5);

  return {
    meta: {
      nSims: cfg.nSims,
      months,
      assets: cfg.assets.map((a) => a.name),
      weights: w,
      model: cfg.model,
      df: cfg.df,
      rebalanceFreq: cfg.rebalanceFreq,
    },
    goalFuture,
    sipEffective: sipEff,
    pSuccess,
    pFail,
    terminal,
    mdd,
    samplePaths,
    terminalPercentiles: percentiles(terminal, [1, 5, 10, 25, 50, 75, 90, 95, 99]),
    mddPercentiles: percentiles(mdd, [1, 5, 10, 25, 50]),
    var5,
    var1,
    cvar5,
    shortfall5,
  };
}
