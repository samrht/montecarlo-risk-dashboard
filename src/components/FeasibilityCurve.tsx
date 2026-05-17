import type { Results } from "../engine/types";
import { Card, SectionTitle } from "./ui";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

function pct(x: number) {
  return (x * 100).toFixed(1) + "%";
}
function inr(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function successProb(terminal: number[], target: number) {
  if (terminal.length === 0) return 0;
  let c = 0;
  for (const v of terminal) if (v >= target) c++;
  return c / terminal.length;
}

const COLORS = ["#22d3ee", "#fb7185", "#fbbf24", "#a78bfa"];

type ChartRow = { target: number; base: number; [key: string]: number };

type TooltipEntry = {
  name: string;
  value: number;
  color: string;
};

function FeasibilityTooltip({
  active,
  payload,
  stressLabels,
}: {
  active?: boolean;
  payload?: { payload?: ChartRow }[];
  stressLabels: string[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  if (!row) return null;

  const entries: TooltipEntry[] = [
    { name: "Base", value: row.base, color: COLORS[0] },
    ...stressLabels.map((label, idx) => ({
      name: label,
      value: row[`stress_${idx}`] ?? 0,
      color: COLORS[(idx + 1) % COLORS.length],
    })),
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/90 px-3 py-2 shadow-xl backdrop-blur-md">
      <div className="mb-1 text-xs font-semibold text-zinc-200">
        Target {inr(row.target)}
      </div>
      {entries.map((e) => (
        <div key={e.name} className="flex items-center gap-2 text-xs">
          <span style={{ color: e.color }}>●</span>
          <span className="text-zinc-400 w-28 truncate">{e.name}</span>
          <span className="font-semibold text-zinc-100">{pct(e.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function FeasibilityCurve({
  base,
  stress,
}: {
  base: Results;
  stress: { label: string; res: Results }[];
}) {
  const steps = 13;
  const minMul = 0.5;
  const maxMul = 1.6;

  const targets = Array.from({ length: steps }, (_, idx) => {
    const mul = minMul + (idx * (maxMul - minMul)) / (steps - 1);
    return base.goalFuture * mul;
  });

  // Build a single unified dataset with one row per target point,
  // all series as keys — this lets Recharts share the x-axis and
  // the tooltip receives the full row (all series values at once).
  const chartData: ChartRow[] = targets.map((t) => {
    const row: ChartRow = {
      target: t,
      base: successProb(base.terminal, t),
    };
    stress.forEach((s, idx) => {
      row[`stress_${idx}`] = successProb(s.res.terminal, t);
    });
    return row;
  });

  return (
    <Card className="bg-white/5">
      <SectionTitle
        title="Goal Feasibility Curve"
        subtitle="Base vs stress scenarios (same simulations, different outcomes)"
      />

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis
              dataKey="target"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(v: number) => `${Math.round(v / 1e5)}L`}
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 1]}
              tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,0.15)" }}
              content={
                <FeasibilityTooltip
                  stressLabels={stress.map((s) => s.label)}
                />
              }
            />

            {/* Base curve */}
            <Line
              type="monotone"
              dataKey="base"
              stroke={COLORS[0]}
              strokeWidth={3}
              dot={false}
              name="Base"
            />

            {/* Stress overlays */}
            {stress.map((s, idx) => (
              <Line
                key={s.label}
                type="monotone"
                dataKey={`stress_${idx}`}
                stroke={COLORS[(idx + 1) % COLORS.length]}
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                opacity={0.85}
                name={s.label}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex flex-wrap gap-3 text-xs">
        <span className="font-medium text-zinc-200">Legend:</span>
        <span style={{ color: COLORS[0] }}>━ Base</span>
        {stress.map((s, idx) => (
          <span key={s.label} style={{ color: COLORS[(idx + 1) % COLORS.length] }}>
            ┄ {s.label}
          </span>
        ))}
      </div>
    </Card>
  );
}
