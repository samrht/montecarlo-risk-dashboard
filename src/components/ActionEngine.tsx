import { useEffect, useMemo, useState } from "react";
import type { Config, Results } from "../engine/types";
import { runActions, type ActionResult } from "../engine/actionClient";
import { Card, SectionTitle } from "./ui";

function inr(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}
function pct(x: number) {
  return (x * 100).toFixed(1) + "%";
}

type AState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; data: ActionResult }
  | { kind: "error"; message: string };

export default function ActionEngine({
  cfg,
  base,
}: {
  cfg: Config;
  base: Results;
}) {
  const [state, setState] = useState<AState>({ kind: "idle" });
  const analysisCfg = useMemo<Config>(() => ({ ...cfg }), [cfg]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setState({ kind: "loading" });
      try {
        const data = await runActions(analysisCfg, [0.7, 0.8, 0.9], 2000, 500);
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
          title="Actionable Recommendations"
          subtitle={`Current success: ${pct(
            base.pSuccess
          )} — computing (worker)…`}
        />
        <div className="mt-2 h-2 w-full rounded-full bg-white/10">
          <div className="h-2 w-1/3 animate-pulse rounded-full bg-indigo-500/60" />
        </div>
      </Card>
    );
  }

  if (state.kind === "error") {
    return (
      <Card className="bg-white/5">
        <SectionTitle
          title="Actionable Recommendations"
          subtitle="Could not compute actions"
        />
        <div className="text-sm text-rose-300">{state.message}</div>
      </Card>
    );
  }

  const items = state.data.items;
  const item80 = items.find((x) => Math.abs(x.target - 0.8) < 1e-9);

  return (
    <Card className="bg-white/5">
      <SectionTitle
        title="Actionable Recommendations"
        subtitle={`Current success: ${pct(base.pSuccess)} — computed with ${
          state.data.usedNSims
        } sims (worker)`}
      />

      {item80 ? (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-7 space-y-3">
            {item80.requiredSip === null ? (
              <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3">
                <div className="text-sm font-semibold text-amber-200">
                  80% success is unreachable under your SIP caps.
                </div>
                <div className="mt-1 text-sm text-zinc-200">
                  Max feasible SIP (after caps):{" "}
                  <b>{inr(item80.maxFeasibleSip)}</b>
                </div>
                <div className="mt-1 text-xs text-zinc-400">
                  Even at max SIP, success ≈ <b>{pct(item80.pAtMax)}</b>.
                  Increase income, raise caps, or extend horizon.
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-zinc-950/30 p-3">
                <div className="text-zinc-300">
                  To reach <b>80% success</b>:
                </div>
                <div className="mt-1 text-base font-semibold text-emerald-300">
                  Increase SIP by {inr(item80.deltaSip ?? 0)}/month
                </div>
                <div className="mt-1 text-xs text-zinc-400">
                  ({inr(cfg.sipMonthly)} → {inr(item80.requiredSip)})
                </div>
              </div>
            )}
          </div>

          <div className="col-span-12 lg:col-span-5">
            <div className="rounded-xl border border-white/10 bg-zinc-950/30 p-3">
              <div className="text-sm font-semibold text-zinc-200">
                Required SIP for target success
              </div>

              <div className="mt-3 space-y-2 text-xs">
                {items.map((it) => (
                  <Row
                    key={it.target}
                    label={`${Math.round(it.target * 100)}%`}
                    value={
                      it.requiredSip === null
                        ? "Unreachable"
                        : inr(it.requiredSip)
                    }
                    delta={it.deltaSip === null ? "" : `(+${inr(it.deltaSip)})`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function Row({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-zinc-400">{label}</div>
      <div className="text-zinc-200 font-medium">{value}</div>
      <div className="text-zinc-400">{delta}</div>
    </div>
  );
}
