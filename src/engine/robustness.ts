import type { Config } from "./types";
import { runMonteCarloSync } from "./simulateSync";

function perturbConfig(
  cfg: Config,
  muShift: number,
  sigmaMult: number,
  corrBoost: number
): Config {
  const baseCorr = cfg.corr ?? [];

  return {
    ...cfg,
    assets: cfg.assets.map((a) => ({
      ...a,
      muAnnual: a.muAnnual + muShift,
      sigmaAnnual: a.sigmaAnnual * sigmaMult,
    })),
    corr: baseCorr.map((row, i) =>
      row.map((v, j) => (i === j ? 1 : Math.min(0.95, v + corrBoost)))
    ),
  };
}

export function robustnessScore(cfg: Config) {
  const base = runMonteCarloSync(cfg);

  const stressed = [
    perturbConfig(cfg, -0.01, 1.1, 0.1),
    perturbConfig(cfg, -0.02, 1.2, 0.2),
  ];

  const drops = stressed.map(
    (c) => base.pSuccess - runMonteCarloSync(c).pSuccess
  );

  const worst = Math.max(...drops);

  if (worst < 0.1) return { level: "Robust", color: "🟢", drop: worst };
  if (worst < 0.25) return { level: "Sensitive", color: "🟡", drop: worst };
  return { level: "Fragile", color: "🔴", drop: worst };
}
