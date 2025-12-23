import type { Config, Results, StressTest } from "./types";
import {
  annualToMonthly,
  cvarLower,
  cholesky,
  matVec,
  mulberry32,
  normalizeWeights,
  percentile,
  percentiles,
  randChiSquare,
  randn,
} from "./math";

function identity(n: number) {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );
}

function maxDrawdown(path: number[]) {
  let peak = path[0];
  let mdd = 0;
  for (const v of path) {
    if (v > peak) peak = v;
    const dd = (v - peak) / peak;
    if (dd < mdd) mdd = dd;
  }
  return mdd;
}

export function runMonteCarlo(
  cfg: Config,
  stress: StressTest | null,
  onProgress?: (p: number) => void,
  shouldCancel?: () => boolean
): Results {
  const months = Math.max(1, Math.floor(cfg.years * 12));
  const n = cfg.assets.length;
  if (n < 1) throw new Error("Add at least one asset.");

  const haircut = stress?.returnHaircut ?? 0;
  const volMult = stress?.volMultiplier ?? 1;

  const assets = cfg.assets.map((a) => ({
    ...a,
    muAnnual: a.muAnnual - haircut,
    sigmaAnnual: a.sigmaAnnual * volMult,
  }));

  const w = normalizeWeights(assets.map((a) => a.weight));

  const corr = cfg.corr && cfg.corr.length === n ? cfg.corr : identity(n);
  const L = cholesky(corr);

  const rand = mulberry32(cfg.seed + (stress ? 999 : 0));

  let sipEff = cfg.sipMonthly;
  if (typeof cfg.incomeMonthly === "number") {
    sipEff = Math.min(sipEff, cfg.sipCapPct * cfg.incomeMonthly);
  }
  if (typeof cfg.contribCapMonthly === "number") {
    sipEff = Math.min(sipEff, cfg.contribCapMonthly);
  }

  const goalFuture =
    cfg.goalToday * Math.pow(1 + cfg.inflationAnnual, cfg.years);
  const feeM = Math.pow(1 - cfg.terAnnual, 1 / 12) - 1;

  const rebalanceEvery =
    cfg.rebalanceFreq === "none"
      ? null
      : cfg.rebalanceFreq === "monthly"
      ? 1
      : cfg.rebalanceFreq === "quarterly"
      ? 3
      : 12;

  const terminal: number[] = [];
  const mdd: number[] = [];
  const samplePaths: number[][] = [];
  const keepPaths = 120;

  let successCount = 0;

  for (let s = 0; s < cfg.nSims; s++) {
    if (shouldCancel?.()) throw new Error("Cancelled");
    if (s % 200 === 0) onProgress?.(s / cfg.nSims);

    let holdings = w.map((wi) => cfg.lumpSum * wi);
    const path: number[] = new Array(months + 1);
    path[0] = holdings.reduce((a, b) => a + b, 0);

    for (let t = 1; t <= months; t++) {
      for (let i = 0; i < n; i++) holdings[i] += sipEff * w[i];

      const z = new Array(n).fill(0).map(() => randn(rand));
      const zc = matVec(L, z);

      let scale = 1;
      if (cfg.model === "t") {
        const df = Math.max(2, Math.floor(cfg.df));
        const chi = randChiSquare(rand, df);
        scale = Math.sqrt(df / (chi || 1e-12));
      }

      for (let i = 0; i < n; i++) {
        const { muM, sigmaM } = annualToMonthly(
          assets[i].muAnnual,
          assets[i].sigmaAnnual
        );
        const r = muM + sigmaM * zc[i] * scale;
        holdings[i] *= 1 + r;
      }

      if (rebalanceEvery && t % rebalanceEvery === 0) {
        const total = holdings.reduce((a, b) => a + b, 0);
        holdings = w.map((wi) => total * wi);
      }

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

    if (
      samplePaths.length < keepPaths &&
      s % Math.floor(cfg.nSims / keepPaths || 1) === 0
    ) {
      samplePaths.push(path);
    }
  }

  onProgress?.(1);

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
    terminalPercentiles: percentiles(
      terminal,
      [1, 5, 10, 25, 50, 75, 90, 95, 99]
    ),
    mddPercentiles: percentiles(mdd, [1, 5, 10, 25, 50]),
    var5,
    var1,
    cvar5,
    shortfall5,
  };
}
