/// <reference lib="webworker" />

import type { Config } from "./types";

type RobustnessMsg = {
  type: "robustness";
  id: string;
  cfg: Config;
  capSims?: number;
};

type RobustnessResult = {
  level: "Robust" | "Sensitive" | "Fragile";
  color: "🟢" | "🟡" | "🔴";
  drop: number; // worst drop in success prob
  base: number;
  stressed: number[];
};

type RobustnessOut =
  | { type: "robustness_done"; id: string; result: RobustnessResult }
  | { type: "error"; id: string; message: string };

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

// Lightweight per-path simulation (same idea as your sync engine, but runs off-thread)
function simulateTerminal(cfg: Config): number {
  let wealth = cfg.lumpSum;
  const months = cfg.years * 12;

  for (let m = 0; m < months; m++) {
    wealth += cfg.sipMonthly;

    let r = 0;
    for (const a of cfg.assets) {
      const muM = a.muAnnual / 12;
      const sigmaM = a.sigmaAnnual / Math.sqrt(12);
      r += a.weight * (muM + sigmaM * randn());
    }
    wealth *= 1 + r;
  }

  return wealth;
}

function estimatePSuccess(cfg: Config): number {
  const goalF = futureGoal(cfg);
  let success = 0;
  for (let i = 0; i < cfg.nSims; i++) {
    if (simulateTerminal(cfg) >= goalF) success++;
  }
  return success / cfg.nSims;
}

function perturbConfig(
  cfg: Config,
  muShift: number,
  sigmaMult: number,
  corrBoost: number
): Config {
  // If you use corr in your main engine, keep it shape-correct.
  // This worker doesn’t use corr in simulation math (lightweight), but robustness definition includes it.
  const baseCorr = cfg.corr ?? null;

  const bumpedCorr =
    baseCorr === null
      ? null
      : baseCorr.map((row, i) =>
          row.map((v, j) => (i === j ? 1 : Math.min(0.95, v + corrBoost)))
        );

  return {
    ...cfg,
    assets: cfg.assets.map((a) => ({
      ...a,
      muAnnual: a.muAnnual + muShift,
      sigmaAnnual: a.sigmaAnnual * sigmaMult,
    })),
    corr: bumpedCorr,
  };
}

self.onmessage = (ev: MessageEvent<RobustnessMsg>) => {
  const msg = ev.data;

  if (msg.type !== "robustness") return;

  try {
    const cap = msg.capSims ?? 2500;
    const cfg: Config = {
      ...msg.cfg,
      nSims: Math.max(500, Math.min(msg.cfg.nSims, cap)),
    };

    const base = estimatePSuccess(cfg);

    const stressedCfgs: Config[] = [
      perturbConfig(cfg, -0.01, 1.1, 0.1),
      perturbConfig(cfg, -0.02, 1.2, 0.2),
      perturbConfig(cfg, -0.015, 1.25, 0.15),
    ];

    const stressed = stressedCfgs.map(estimatePSuccess);

    const drops = stressed.map((p) => Math.max(0, base - p));
    const worst = Math.max(...drops);

    const result: RobustnessResult =
      worst < 0.1
        ? { level: "Robust", color: "🟢", drop: worst, base, stressed }
        : worst < 0.25
        ? { level: "Sensitive", color: "🟡", drop: worst, base, stressed }
        : { level: "Fragile", color: "🔴", drop: worst, base, stressed };

    const out: RobustnessOut = { type: "robustness_done", id: msg.id, result };
    self.postMessage(out);
  } catch (e) {
    const out: RobustnessOut = {
      type: "error",
      id: msg.id,
      message: e instanceof Error ? e.message : "Unknown error",
    };
    self.postMessage(out);
  }
};

export {};
