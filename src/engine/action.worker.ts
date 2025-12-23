/// <reference lib="webworker" />

import type { Config } from "./types";

type ActionMsg = {
  type: "actions";
  id: string;
  cfg: Config;
  targets: number[];
  capSims?: number;
  sipRoundTo?: number; // e.g. 500
};

export type ActionItem = {
  target: number;
  requiredSip: number | null; // null => unreachable under caps
  deltaSip: number | null; // null => unreachable
  maxFeasibleSip: number; // effective max
  pAtCurrent: number; // estimate at current SIP
  pAtMax: number; // estimate at max feasible SIP
};

type ActionResult = {
  items: ActionItem[];
  usedNSims: number;
};

type ActionOut =
  | { type: "actions_done"; id: string; result: ActionResult }
  | { type: "error"; id: string; message: string };

function randn() {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function clampSip(cfg: Config, requestedSip: number) {
  const capPct = cfg.sipCapPct ?? 1;
  const incomeCap = (cfg.incomeMonthly ?? 0) * capPct;
  const contribCap = cfg.contribCapMonthly ?? Number.POSITIVE_INFINITY;
  const maxFeasible = Math.max(0, Math.min(incomeCap, contribCap));
  const eff = Math.max(0, Math.min(requestedSip, maxFeasible));
  return { eff, maxFeasible };
}

function futureGoal(cfg: Config) {
  return cfg.goalToday * Math.pow(1 + cfg.inflationAnnual, cfg.years);
}

// Lightweight terminal sim for action search.
// IMPORTANT: uses *effective SIP* with caps.
function simulateTerminal(cfg: Config, requestedSip: number): number {
  const { eff: sipEff } = clampSip(cfg, requestedSip);

  let wealth = cfg.lumpSum;
  const months = cfg.years * 12;

  for (let m = 0; m < months; m++) {
    wealth += sipEff;

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

function estimatePSuccess(cfg: Config, requestedSip: number): number {
  const goalF = futureGoal(cfg);
  let success = 0;
  for (let i = 0; i < cfg.nSims; i++) {
    if (simulateTerminal(cfg, requestedSip) >= goalF) success++;
  }
  return success / cfg.nSims;
}

function roundTo(x: number, step: number) {
  if (step <= 1) return Math.round(x);
  return Math.round(x / step) * step;
}

function requiredSipForTarget(
  cfg: Config,
  targetP: number,
  roundStep: number
): ActionItem {
  const currentRequested = cfg.sipMonthly;

  const { maxFeasible: maxFeasibleSip } = clampSip(cfg, Number.POSITIVE_INFINITY);

  const pAtCurrent = estimatePSuccess(cfg, currentRequested);
  const pAtMax = estimatePSuccess(cfg, maxFeasibleSip);

  // If already meets target, required SIP is current (rounded nicely)
  if (pAtCurrent >= targetP) {
    const curRounded = roundTo(currentRequested, roundStep);
    return {
      target: targetP,
      requiredSip: curRounded,
      deltaSip: 0,
      maxFeasibleSip,
      pAtCurrent,
      pAtMax,
    };
  }

  // If even max feasible can't reach target => unreachable under constraints
  if (pAtMax < targetP) {
    return {
      target: targetP,
      requiredSip: null,
      deltaSip: null,
      maxFeasibleSip,
      pAtCurrent,
      pAtMax,
    };
  }

  // Binary search between current and max feasible
  let lo = Math.max(0, currentRequested);
  let hi = maxFeasibleSip;

  // Search
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2;
    const p = estimatePSuccess(cfg, mid);

    if (p < targetP) lo = mid;
    else hi = mid;
  }

  const req = roundTo(hi, roundStep);
  const delta = Math.max(0, req - currentRequested);

  return {
    target: targetP,
    requiredSip: req,
    deltaSip: roundTo(delta, roundStep),
    maxFeasibleSip,
    pAtCurrent,
    pAtMax,
  };
}

self.onmessage = (ev: MessageEvent<ActionMsg>) => {
  const msg = ev.data;
  if (msg.type !== "actions") return;

  try {
    const cap = msg.capSims ?? 2000;
    const roundStep = msg.sipRoundTo ?? 500;

    const cfg: Config = {
      ...msg.cfg,
      nSims: Math.max(800, Math.min(msg.cfg.nSims, cap)),
    };

    const items = msg.targets.map((t) =>
      requiredSipForTarget(cfg, t, roundStep)
    );

    const out: ActionOut = {
      type: "actions_done",
      id: msg.id,
      result: { items, usedNSims: cfg.nSims },
    };

    (self as DedicatedWorkerGlobalScope).postMessage(out);
  } catch (e) {
    const out: ActionOut = {
      type: "error",
      id: msg.id,
      message: e instanceof Error ? e.message : "Unknown error",
    };
    (self as DedicatedWorkerGlobalScope).postMessage(out);
  }
};

export {};
