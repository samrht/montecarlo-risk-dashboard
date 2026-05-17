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

/** Linear interpolation of weights from startW → endW over totalMonths */
function glideWeights(
  startW: number[],
  endW: number[],
  t: number,
  totalMonths: number
): number[] {
  const frac = totalMonths <= 1 ? 1 : t / (totalMonths - 1);
  return startW.map((s, i) => s + (endW[i] - s) * Math.min(1, Math.max(0, frac)));
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

  const baseW = normalizeWeights(assets.map((a) => a.weight));

  // Glide-path end weights (normalised)
  const glide = cfg.glidePath;
  const glideEnabled = glide?.enabled && glide.endWeights.length === n;
  const endW = glideEnabled ? normalizeWeights(glide!.endWeights) : baseW;

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

  // Tax config
  const tax = cfg.taxConfig;
  const taxEnabled = tax?.enabled ?? false;
  const equitySet = new Set(tax?.equityAssetIndices ?? []);

  // Regime config
  const regime = cfg.regimeConfig;
  const regimeEnabled = regime?.enabled ?? false;

  // Panic config
  const panic = cfg.panicConfig;
  const panicEnabled = panic?.enabled ?? false;

  const terminal: number[] = [];
  const mdd: number[] = [];
  const samplePaths: number[][] = [];
  const keepPaths = 120;

  let successCount = 0;

  for (let s = 0; s < cfg.nSims; s++) {
    if (shouldCancel?.()) throw new Error("Cancelled");
    if (s % 200 === 0) onProgress?.(s / cfg.nSims);

    // Compute initial weights (month 0)
    const w0 = glideEnabled ? glideWeights(baseW, endW, 0, months) : baseW;
    let holdings = w0.map((wi) => cfg.lumpSum * wi);

    const path: number[] = new Array(months + 1);
    path[0] = holdings.reduce((a, b) => a + b, 0);

    // Regime state: start in bull
    let isBull = true;

    // Panic state
    let peakForPanic = path[0];
    let panicMonthsLeft = 0;

    // Tax basis tracking (cost basis per asset for LTCG)
    let costBasis = [...holdings];

    for (let t = 1; t <= months; t++) {
      // ── Regime transition ────────────────────────────────────────────────
      if (regimeEnabled) {
        const p = rand();
        if (isBull) {
          isBull = p < regime!.pBullBull;
        } else {
          isBull = p >= regime!.pBearBear;
        }
      }

      // ── Glide-path weights for this month ────────────────────────────────
      const wt = glideEnabled ? glideWeights(baseW, endW, t - 1, months) : baseW;

      // ── Panic check: update peak, determine SIP pause ────────────────────
      const portfolioVal = holdings.reduce((a, b) => a + b, 0);
      if (panicEnabled) {
        if (portfolioVal > peakForPanic) peakForPanic = portfolioVal;
        const dd = peakForPanic > 0 ? (peakForPanic - portfolioVal) / peakForPanic : 0;
        if (dd >= panic!.threshold && panicMonthsLeft === 0) {
          panicMonthsLeft = panic!.pauseMonths;
        }
      }

      // ── SIP contribution ─────────────────────────────────────────────────
      const sipThisMonth = panicEnabled && panicMonthsLeft > 0 ? 0 : sipEff;
      if (panicEnabled && panicMonthsLeft > 0) panicMonthsLeft--;

      for (let i = 0; i < n; i++) {
        const contrib = sipThisMonth * wt[i];
        holdings[i] += contrib;
        costBasis[i] += contrib;
      }

      // ── Returns (with regime shift) ───────────────────────────────────────
      const z = new Array(n).fill(0).map(() => randn(rand));
      const zc = matVec(L, z);

      let scale = 1;
      if (cfg.model === "t") {
        const df = Math.max(2, Math.floor(cfg.df));
        const chi = randChiSquare(rand, df);
        scale = Math.sqrt(df / (chi || 1e-12));
      }

      for (let i = 0; i < n; i++) {
        let { muM, sigmaM } = annualToMonthly(
          assets[i].muAnnual,
          assets[i].sigmaAnnual
        );

        // Bear regime: shift return down, inflate vol
        if (regimeEnabled && !isBull) {
          const bearShiftM = regime!.bearReturnShift / 12;
          muM += bearShiftM;
          sigmaM *= regime!.bearVolMult;
        }

        const r = muM + sigmaM * zc[i] * scale;
        holdings[i] *= 1 + r;
      }

      // ── Rebalancing ───────────────────────────────────────────────────────
      if (rebalanceEvery && t % rebalanceEvery === 0) {
        const total = holdings.reduce((a, b) => a + b, 0);
        holdings = wt.map((wi) => total * wi);
        // Reset cost basis proportionally after rebalance
        if (taxEnabled) {
          const totalBasis = costBasis.reduce((a, b) => a + b, 0);
          costBasis = wt.map((wi) => totalBasis * wi);
        }
      }

      // ── Fees ──────────────────────────────────────────────────────────────
      const totalBeforeFee = holdings.reduce((a, b) => a + b, 0);
      const totalAfterFee = totalBeforeFee * (1 + feeM);
      const k = totalBeforeFee > 0 ? totalAfterFee / totalBeforeFee : 1;
      for (let i = 0; i < n; i++) holdings[i] *= k;

      // ── Tax drag ─────────────────────────────────────────────────────────
      if (taxEnabled) {
        // Debt: income tax on gains every month
        for (let i = 0; i < n; i++) {
          if (!equitySet.has(i)) {
            const gain = Math.max(0, holdings[i] - costBasis[i]);
            const taxDue = gain * tax!.debtTaxRate;
            holdings[i] -= taxDue;
            costBasis[i] = holdings[i]; // step up basis
          }
        }

        // Equity: LTCG annually (every 12 months)
        if (t % 12 === 0) {
          for (let i = 0; i < n; i++) {
            if (equitySet.has(i)) {
              const gain = Math.max(0, holdings[i] - costBasis[i]);
              const taxDue = gain * tax!.ltcgRate;
              holdings[i] -= taxDue;
              costBasis[i] = holdings[i]; // step up basis
            }
          }
        }
      }

      path[t] = holdings.reduce((a, b) => a + b, 0);
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
      weights: baseW,
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
