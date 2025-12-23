import type { Config, Results } from "./types";

/* ---------- utilities ---------- */

function randn() {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function futureGoal(cfg: Config) {
  return cfg.goalToday * Math.pow(1 + cfg.inflationAnnual, cfg.years);
}

function percentile(sorted: number[], p: number) {
  if (sorted.length === 0) return 0;
  const idx = Math.floor(p * (sorted.length - 1));
  return sorted[Math.min(Math.max(idx, 0), sorted.length - 1)];
}

function percentiles(sorted: number[]) {
  return {
    p5: percentile(sorted, 0.05),
    p25: percentile(sorted, 0.25),
    p50: percentile(sorted, 0.5),
    p75: percentile(sorted, 0.75),
    p95: percentile(sorted, 0.95),
  };
}

/* ---------- one-path simulation (now returns path + terminal + MDD) ---------- */

function simulatePath(cfg: Config): {
  terminal: number;
  mdd: number;
  path: number[];
} {
  let wealth = cfg.lumpSum;
  const months = cfg.years * 12;

  const path: number[] = new Array(months + 1);
  path[0] = wealth;

  let peak = wealth;
  let maxDrawdown = 0; // as a fraction (0.2 = -20%)

  for (let m = 0; m < months; m++) {
    // contribution at start of month
    wealth += cfg.sipMonthly;

    // portfolio monthly return
    let r = 0;
    for (const a of cfg.assets) {
      const muM = a.muAnnual / 12;
      const sigmaM = a.sigmaAnnual / Math.sqrt(12);
      r += a.weight * (muM + sigmaM * randn());
    }

    wealth *= 1 + r;
    path[m + 1] = wealth;

    // drawdown tracking
    if (wealth > peak) peak = wealth;
    const dd = peak > 0 ? (peak - wealth) / peak : 0;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  return { terminal: wealth, mdd: maxDrawdown, path };
}

/* ---------- synchronous Monte Carlo ---------- */

export function runMonteCarloSync(cfg: Config): Results {
  const terminal: number[] = [];
  const mdd: number[] = [];
  const goalF = futureGoal(cfg);

  // keep a few paths for charts/debug (don’t store all unless you hate RAM)
  const maxSamplePaths = Math.min(25, cfg.nSims);
  const samplePaths: number[][] = [];

  for (let i = 0; i < cfg.nSims; i++) {
    const sim = simulatePath(cfg);
    terminal.push(sim.terminal);
    mdd.push(sim.mdd);
    if (i < maxSamplePaths) samplePaths.push(sim.path);
  }

  // sort copies for percentile work
  const terminalSorted = [...terminal].sort((a, b) => a - b);
  const mddSorted = [...mdd].sort((a, b) => a - b);

  const pSuccess = terminal.filter((v) => v >= goalF).length / terminal.length;
  const pFail = 1 - pSuccess;

  const q = (p: number) => percentile(terminalSorted, p);

  // VaR style stats (in "terminal wealth" space, consistent with your current code)
  const var5 = q(0.05);
  const var1 = q(0.01);

  const tail5 = terminalSorted.filter((v) => v <= var5);
  const cvar5 =
    tail5.length > 0 ? tail5.reduce((a, b) => a + b, 0) / tail5.length : var5;

  // shortfall at 5% (how much you miss the goal at the 5th percentile terminal)
  const shortfall5 = Math.max(0, goalF - var5);

  const terminalPercentiles = percentiles(terminalSorted);
  const mddPercentiles = percentiles(mddSorted);

  return {
    // existing fields you already had
    terminal: terminalSorted, // keep sorted, matches your prior behavior
    mdd,

    pSuccess,
    pFail,

    var5,
    cvar5,

    goalFuture: goalF,
    sipEffective: cfg.sipMonthly,

    mddPercentiles,

    meta: {
      nSims: cfg.nSims,
      months: cfg.years * 12,
      assets: cfg.assets.map((a) => a.name),
      weights: cfg.assets.map((a) => a.weight),
      model: cfg.model,
      df: cfg.df ?? 0,
      rebalanceFreq: cfg.rebalanceFreq,
    },

    
    samplePaths,
    terminalPercentiles,
    var1,
    shortfall5,
  };
}
