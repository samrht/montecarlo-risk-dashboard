import { useEffect, useRef, useState } from "react";
import type { Config, Results } from "../engine/types";
import { runRobustness, type RobustnessResult } from "../engine/robustnessClient";
import { Card, SectionTitle } from "./ui";

type RState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; data: RobustnessResult }
  | { kind: "error"; message: string };

function pct(x: number) { return (x * 100).toFixed(1) + "%"; }

const SCENARIOS = [
  { label: "Mild stress", desc: "μ−1%, σ×1.1, corr+0.1" },
  { label: "Moderate stress", desc: "μ−2%, σ×1.2, corr+0.2" },
  { label: "Severe stress", desc: "μ−1.5%, σ×1.25, corr+0.15" },
];

export default function RobustnessBox({ cfg, base }: { cfg: Config; base: Results }) {
  const [state, setState] = useState<RState>({ kind: "idle" });

  const cfgKey = JSON.stringify(cfg);
  const prevKey = useRef<string>("");

  useEffect(() => {
    if (cfgKey === prevKey.current) return;
    prevKey.current = cfgKey;

    let cancelled = false;
    setState({ kind: "loading" });

    runRobustness(cfg, 2500)
      .then((data) => { if (!cancelled) setState({ kind: "ready", data }); })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "Unknown error";
        if (!cancelled) setState({ kind: "error", message: msg });
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfgKey]);

  if (state.kind === "loading" || state.kind === "idle") {
    return (
      <Card className="bg-white/5">
        <SectionTitle
          title="Robustness Assessment"
          subtitle={`Base: ${pct(base.pSuccess)} — running stress perturbations…`}
        />
        <div className="mt-2 h-2 w-full rounded-full bg-white/10">
          <div className="h-2 w-1/2 animate-pulse rounded-full bg-cyan-500/60" />
        </div>
      </Card>
    );
  }

  if (state.kind === "error") {
    return (
      <Card className="bg-white/5">
        <SectionTitle title="Robustness Assessment" subtitle="Computation failed" />
        <div className="text-sm text-rose-300">{state.message}</div>
      </Card>
    );
  }

  const r = state.data;

  const levelBg =
    r.level === "Robust"
      ? "border-emerald-500/30 bg-emerald-500/10"
      : r.level === "Sensitive"
      ? "border-amber-500/30 bg-amber-500/10"
      : "border-rose-500/30 bg-rose-500/10";

  const levelText =
    r.level === "Robust" ? "text-emerald-300"
    : r.level === "Sensitive" ? "text-amber-300"
    : "text-rose-300";

  return (
    <Card className="bg-white/5">
      <SectionTitle
        title="Robustness Assessment"
        subtitle={`Base P(success): ${pct(r.base)} — sensitivity to assumption errors`}
      />

      {/* Badge */}
      <div className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 ${levelBg}`}>
        <span>{r.color}</span>
        <span className={`text-sm font-semibold ${levelText}`}>{r.level}</span>
        <span className="text-xs text-zinc-400">
          worst drop {Math.round(r.drop * 100)}pp
        </span>
      </div>

      {/* Stressed scenario table */}
      <div className="mt-3 space-y-1.5">
        {SCENARIOS.map((sc, i) => {
          const p = r.stressed[i] ?? 0;
          const drop = r.base - p;
          return (
            <div
              key={sc.label}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2"
            >
              <div>
                <div className="text-xs font-medium text-zinc-200">{sc.label}</div>
                <div className="text-xs text-zinc-500">{sc.desc}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-zinc-100">{pct(p)}</div>
                <div className={`text-xs ${drop > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                  {drop > 0 ? "−" : "+"}{Math.abs(Math.round(drop * 100))}pp
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 text-xs text-zinc-500">
        Each scenario perturbs μ, σ, and correlations. Runs fully off-thread.
      </div>
    </Card>
  );
}
