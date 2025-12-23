import type { Config } from "./types";
import { runMonteCarloSync } from "./simulateSync";

/**
 * Generic binary search solver
 */
function solveMonotonic(
  lo: number,
  hi: number,
  fn: (x: number) => number,
  target: number,
  tol = 0.002,
  maxIter = 20
) {
  let mid = lo;
  for (let i = 0; i < maxIter; i++) {
    mid = (lo + hi) / 2;
    const val = fn(mid);
    if (Math.abs(val - target) < tol) break;
    if (val < target) lo = mid;
    else hi = mid;
  }
  return mid;
}

/**
 * REQUIRED SIP FOR TARGET SUCCESS
 */
export function requiredSip(baseCfg: Config, targetP: number) {
  const fn = (sip: number) => {
    const cfg: Config = { ...baseCfg, sipMonthly: sip };
    return runMonteCarloSync(cfg).pSuccess;
  };

  return Math.round(
    solveMonotonic(baseCfg.sipMonthly, baseCfg.sipMonthly * 3, fn, targetP)
  );
}

/**
 * REQUIRED DELAY (YEARS) FOR TARGET SUCCESS
 */
export function requiredDelayYears(baseCfg: Config, targetP: number) {
  const fn = (yrs: number) => {
    const cfg: Config = { ...baseCfg, years: Math.round(yrs) };
    return runMonteCarloSync(cfg).pSuccess;
  };

  const yrs = solveMonotonic(baseCfg.years, baseCfg.years + 10, fn, targetP);

  return Math.round(yrs - baseCfg.years);
}
