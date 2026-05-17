/// <reference lib="webworker" />

/**
 * sensitivity.worker.ts
 *
 * Computes real sensitivity (tornado) data by re-running Monte Carlo
 * at ±10% perturbations of each key input. Uses the same physics as
 * the main simulation: Cholesky correlation, TER, rebalancing, t-dist.
 */

import type { Config } from "./types";
import {
  annualToMonthly,
  cholesky,
  matVec,
  normalizeWeights,
  randChiSquare,
  randn,
} from "./math";

export type TornadoRow = {
  name: string;
  deltaUp: number;   // change in pSuccess when param is +10%
  deltaDown: number; // change in pSuccess when param is -10%
  pUp: number;
  pDown: number;
  pBase: number;
};

type SensitivityMsg = {
  type: "sensitivity";
  id: string;
  cfg: Config;
  capSims?: number;
};

type SensitivityOut =
  | { type: "sensitivity_done"; id: string; rows: TornadoRow[]; pBase: number }
  | { type: "error"; id: string; message: string };

/* ---------- physics ---------- */

function identity(n: number): number[][] {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );
}

function estimatePSuccess(cfg: Config): number {
  const months = Math.max(1, Math.floor(cfg.years * 12));
  const n = cfg.assets.length;
  const w = normalizeWeights(cfg.assets.map((a) => a.weight));
  const corr = cfg.corr && cfg.corr.length === n ? cfg.corr : identity(n);
  const L = cholesky(corr);
  const rand = Math.random.bind(Math);

  let sipEff = cfg.sipMonthly;
  if (typeof cfg.incomeMonthly === "number") {
    sipEff = Math.min(sipEff, cfg.sipCapPct * cfg.incomeMonthly);
  }
  if (typeof cfg.contribCapMonthly === "number") {
    sipEff = Math.min(sipEff, cfg.contribCapMonthly);
  }

  const goalFuture = cfg.goalToday * Math.pow(1 + cfg.inflationAnnual, cfg.years);
  const feeM = Math.pow(1 - cfg.terAnnual, 1 / 12) - 1;

  const rebalanceEvery =
    cfg.rebalanceFreq === "none" ? null
    : cfg.rebalanceFreq === "monthly" ? 1
    : cfg.rebalanceFreq === "quarterly" ? 3
    : 12;

  let successCount = 0;

  for (let s = 0; s < cfg.nSims; s++) {
    let holdings = w.map((wi) => cfg.lumpSum * wi);

    for (let t = 1; t <= months; t++) {
      for (let i = 0; i < n; i++) holdings[i] += sipEff * w[i];

      const z = Array.from({ length: n }, () => randn(rand));
      const zc = matVec(L, z);

      let scale = 1;
      if (cfg.model === "t") {
        const df = Math.max(2, Math.floor(cfg.df));
        const chi = randChiSquare(rand, df);
        scale = Math.sqrt(df / (chi || 1e-12));
      }

      for (let i = 0; i < n; i++) {
        const { muM, sigmaM } = annualToMonthly(
          cfg.assets[i].muAnnual,
          cfg.assets[i].sigmaAnnual
        );
        const r = muM + sigmaM * zc[i] * scale;
        holdings[i] *= 1 + r;
      }

      if (rebalanceEvery && t % rebalanceEvery === 0) {
        const total = holdings.reduce((a, b) => a + b, 0);
        holdings = w.map((wi) => total * wi);
      }

      const totalBefore = holdings.reduce((a, b) => a + b, 0);
      const totalAfter = totalBefore * (1 + feeM);
      const k = totalBefore > 0 ? totalAfter / totalBefore : 1;
      for (let i = 0; i < n; i++) holdings[i] *= k;
    }

    const term = holdings.reduce((a, b) => a + b, 0);
    if (term >= goalFuture) successCount++;
  }

  return successCount / cfg.nSims;
}

/* ---------- perturbations ---------- */

function perturbMu(cfg: Config, factor: number): Config {
  return {
    ...cfg,
    assets: cfg.assets.map((a) => ({
      ...a,
      muAnnual: a.muAnnual * factor,
    })),
  };
}

function perturbSigma(cfg: Config, factor: number): Config {
  return {
    ...cfg,
    assets: cfg.assets.map((a) => ({
      ...a,
      sigmaAnnual: a.sigmaAnnual * factor,
    })),
  };
}

function perturbSip(cfg: Config, factor: number): Config {
  return { ...cfg, sipMonthly: cfg.sipMonthly * factor };
}

function perturbInflation(cfg: Config, factor: number): Config {
  return { ...cfg, inflationAnnual: cfg.inflationAnnual * factor };
}

/* ---------- worker message handler ---------- */

self.onmessage = (ev: MessageEvent<SensitivityMsg>) => {
  const msg = ev.data;
  if (msg.type !== "sensitivity") return;

  try {
    const cap = msg.capSims ?? 3000;
    const cfg: Config = {
      ...msg.cfg,
      nSims: Math.max(1000, Math.min(msg.cfg.nSims, cap)),
    };

    const pBase = estimatePSuccess(cfg);

    const inputs: { name: string; up: Config; down: Config }[] = [
      {
        name: "Expected return (μ)",
        up: perturbMu(cfg, 1.1),
        down: perturbMu(cfg, 0.9),
      },
      {
        name: "Volatility (σ)",
        up: perturbSigma(cfg, 1.1),
        down: perturbSigma(cfg, 0.9),
      },
      {
        name: "SIP amount",
        up: perturbSip(cfg, 1.1),
        down: perturbSip(cfg, 0.9),
      },
      {
        name: "Inflation rate",
        up: perturbInflation(cfg, 1.1),
        down: perturbInflation(cfg, 0.9),
      },
    ];

    const rows: TornadoRow[] = inputs.map(({ name, up, down }) => {
      const pUp = estimatePSuccess(up);
      const pDown = estimatePSuccess(down);
      return {
        name,
        pBase,
        pUp,
        pDown,
        deltaUp: pUp - pBase,
        deltaDown: pDown - pBase,
      };
    });

    // Sort by total swing (largest impact first)
    rows.sort(
      (a, b) =>
        Math.abs(b.deltaUp - b.deltaDown) - Math.abs(a.deltaUp - a.deltaDown)
    );

    const out: SensitivityOut = {
      type: "sensitivity_done",
      id: msg.id,
      rows,
      pBase,
    };
    self.postMessage(out);
  } catch (e) {
    const out: SensitivityOut = {
      type: "error",
      id: msg.id,
      message: e instanceof Error ? e.message : "Unknown error",
    };
    self.postMessage(out);
  }
};

export {};
