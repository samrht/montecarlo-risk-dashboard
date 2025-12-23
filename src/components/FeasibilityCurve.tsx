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

  const baseData = targets.map((t) => ({
    target: t,
    p: successProb(base.terminal, t),
  }));

  const stressData = stress.map((s) =>
    targets.map((t) => ({
      target: t,
      p: successProb(s.res.terminal, t),
    }))
  );

  return (
    <Card className="bg-white/5">
      <SectionTitle
        title="Goal Feasibility Curve"
        subtitle="Base vs stress scenarios (same simulations, different outcomes)"
      />

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart>
            <XAxis
              dataKey="target"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(v: number) => `${Math.round(v / 1e5)}L`}
            />
            <YAxis
              domain={[0, 1]}
              tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
            />
            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,0.15)" }}
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const row = payload[0].payload as {
                  target: number;
                  p: number;
                };
                return (
                  <div className="rounded-xl border border-white/10 bg-zinc-950/90 px-3 py-2 shadow-xl backdrop-blur-md">
                    <div className="text-xs font-semibold text-zinc-200">
                      Target {inr(row.target)}
                    </div>
                    <div className="mt-1 text-sm text-zinc-100">
                      P(success){" "}
                      <span className="font-semibold">{pct(row.p)}</span>
                    </div>
                  </div>
                );
              }}
            />

            {/* Base curve */}
            <Line
              data={baseData}
              type="monotone"
              dataKey="p"
              stroke={COLORS[0]}
              strokeWidth={3}
              dot={false}
              name="Base"
            />

            {/* Stress overlays */}
            {stressData.map((d, idx) => (
              <Line
                key={stress[idx].label}
                data={d}
                type="monotone"
                dataKey="p"
                stroke={COLORS[(idx + 1) % COLORS.length]}
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                opacity={0.85}
                name={stress[idx].label}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex flex-wrap gap-3 text-xs">
        <span className="font-medium text-zinc-200">Legend:</span>
        <span className="text-cyan-300">━ Base</span>
        {stress.map((s) => (
          <span key={s.label} className="text-zinc-300">
            ┄ {s.label}
          </span>
        ))}
      </div>
    </Card>
  );
}
