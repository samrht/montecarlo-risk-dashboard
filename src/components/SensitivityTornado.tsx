import { useEffect, useMemo, useState } from "react";
import type { Config, Results } from "../engine/types";
import { runSensitivity } from "../engine/sensitivityClient";
import type { TornadoRow } from "../engine/sensitivity.worker";
import { Card, SectionTitle } from "./ui";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
  ReferenceLine,
} from "recharts";

function pct(x: number) {
  return (x >= 0 ? "+" : "") + (x * 100).toFixed(1) + "%";
}

type TState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; rows: TornadoRow[]; pBase: number }
  | { kind: "error"; message: string };

/** Flatten each TornadoRow into two chart-friendly entries (up + down) */
function toChartData(rows: TornadoRow[]) {
  return rows.map((r) => ({
    name: r.name,
    // For the grouped bar: positive bar = upside impact, negative bar = downside impact
    up: r.deltaUp,
    down: r.deltaDown,
    pUp: r.pUp,
    pDown: r.pDown,
    pBase: r.pBase,
  }));
}

type ChartEntry = ReturnType<typeof toChartData>[number];

function TornadoTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: ChartEntry }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  if (!d) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/90 px-3 py-2 shadow-xl backdrop-blur-md text-xs">
      <div className="font-semibold text-zinc-200 mb-1">{d.name}</div>
      <div className="text-zinc-400">
        Base P(success):{" "}
        <span className="text-zinc-100 font-medium">
          {(d.pBase * 100).toFixed(1)}%
        </span>
      </div>
      <div className="text-emerald-300">
        +10% → {(d.pUp * 100).toFixed(1)}%{" "}
        <span className="text-zinc-400">({pct(d.up)})</span>
      </div>
      <div className="text-rose-300">
        −10% → {(d.pDown * 100).toFixed(1)}%{" "}
        <span className="text-zinc-400">({pct(d.down)})</span>
      </div>
    </div>
  );
}

export default function SensitivityTornado({
  base,
  cfg,
}: {
  base: Results;
  cfg: Config;
}) {
  const [state, setState] = useState<TState>({ kind: "idle" });

  // Only re-run when the config actually changes
  const stableCfg = useMemo(() => cfg, [cfg]);

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });

    runSensitivity(stableCfg, 3000)
      .then(({ rows, pBase }) => {
        if (!cancelled) setState({ kind: "ready", rows, pBase });
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setState({
            kind: "error",
            message: e instanceof Error ? e.message : "Unknown error",
          });
      });

    return () => {
      cancelled = true;
    };
  }, [stableCfg]);

  const subtitle =
    state.kind === "ready"
      ? `Base P(success) = ${(state.pBase * 100).toFixed(1)}% — real ±10% perturbations (worker)`
      : state.kind === "loading" || state.kind === "idle"
      ? "Computing real ±10% perturbations off-thread…"
      : "Sensitivity computation failed";

  return (
    <Card className="bg-white/5">
      <SectionTitle
        title="Sensitivity Analysis (Tornado)"
        subtitle={subtitle}
      />

      {(state.kind === "idle" || state.kind === "loading") && (
        <div className="mt-2 h-2 w-full rounded-full bg-white/10">
          <div className="h-2 w-2/3 animate-pulse rounded-full bg-indigo-500/60" />
        </div>
      )}

      {state.kind === "error" && (
        <div className="mt-2 text-sm text-rose-300">{state.message}</div>
      )}

      {state.kind === "ready" && (
        <>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={toChartData(state.rows)}
                margin={{ left: 8, right: 16, top: 4, bottom: 4 }}
              >
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => pct(v)}
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={155}
                  tick={{ fill: "#e4e4e7", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <ReferenceLine x={0} stroke="rgba(255,255,255,0.2)" />
                <Tooltip
                  content={<TornadoTooltip />}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                {/* Upside bar (green) */}
                <Bar dataKey="up" name="Up (+10%)" radius={[0, 6, 6, 0]}>
                  {toChartData(state.rows).map((entry, idx) => (
                    <Cell
                      key={`up-${idx}`}
                      fill={entry.up >= 0 ? "#34d399" : "#f87171"}
                    />
                  ))}
                </Bar>
                {/* Downside bar (rose) */}
                <Bar dataKey="down" name="Down (−10%)" radius={[6, 0, 0, 6]}>
                  {toChartData(state.rows).map((entry, idx) => (
                    <Cell
                      key={`dn-${idx}`}
                      fill={entry.down <= 0 ? "#f87171" : "#34d399"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-400">
            <span>
              <span className="text-emerald-400">■</span> +10% impact on
              P(success)
            </span>
            <span>
              <span className="text-rose-400">■</span> −10% impact on P(success)
            </span>
            <span className="ml-auto">
              Sorted by total swing · {state.rows[0]?.pBase !== undefined
                ? `${(state.rows[0].pBase * 100).toFixed(1)}% base`
                : ""}
            </span>
          </div>
        </>
      )}
    </Card>
  );
}
