import { useEffect, useMemo, useState } from "react";
import type { Config, Results } from "../engine/types";
import {
  runRobustness,
  type RobustnessResult,
} from "../engine/robustnessClient";
import { Card, SectionTitle } from "./ui";

type RState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; data: RobustnessResult }
  | { kind: "error"; message: string };

function pct(x: number) {
  return (x * 100).toFixed(1) + "%";
}

export default function RobustnessBox({
  cfg,
  base,
}: {
  cfg: Config;
  base: Results;
}) {
  const [state, setState] = useState<RState>({ kind: "idle" });

  // cap sims for robustness worker (fast, stable UX)
  const analysisCfg = useMemo<Config>(() => ({ ...cfg }), [cfg]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setState({ kind: "loading" });
      try {
        const data = await runRobustness(analysisCfg, 2500);
        if (!cancelled) setState({ kind: "ready", data });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        if (!cancelled) setState({ kind: "error", message: msg });
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [analysisCfg]);

  if (state.kind === "loading" || state.kind === "idle") {
    return (
      <Card className="bg-white/5">
        <SectionTitle
          title="Robustness Assessment"
          subtitle={`Current success: ${pct(
            base.pSuccess
          )} — running stress perturbations…`}
        />
        <div className="text-sm text-zinc-300">
          Off-thread compute via Web Worker (so the UI doesn’t die).
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-white/10">
          <div className="h-2 w-1/2 animate-pulse rounded-full bg-cyan-500/60" />
        </div>
      </Card>
    );
  }

  if (state.kind === "error") {
    return (
      <Card className="bg-white/5">
        <SectionTitle
          title="Robustness Assessment"
          subtitle={`Current success: ${pct(
            base.pSuccess
          )} — robustness failed`}
        />
        <div className="text-sm text-rose-300">{state.message}</div>
      </Card>
    );
  }

  const r = state.data;

  return (
    <Card className="bg-white/5">
      <SectionTitle
        title="Robustness Assessment"
        subtitle={`Base success: ${pct(
          r.base
        )} — sensitivity to assumption errors`}
      />

      <div className="text-lg font-semibold">
        {r.color} {r.level}
      </div>

      <div className="mt-1 text-sm text-zinc-300">
        Worst-case success drop: <b>{Math.round(r.drop * 100)}%</b>
      </div>

      <div className="mt-2 text-xs text-zinc-500">
        Perturbs μ down, σ up, corr up (robustness test). Runs fully in worker.
      </div>
    </Card>
  );
}
