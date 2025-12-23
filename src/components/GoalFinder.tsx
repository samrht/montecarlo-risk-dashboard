import React from "react";
import type { Results } from "../engine/types";
import { Card, SectionTitle, Input } from "./ui";

function inr(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

/** quantile q in [0,1] */
function quantile(arr: number[], q: number) {
  if (arr.length === 0) return 0;
  const xs = [...arr].sort((a, b) => a - b);
  const pos = (xs.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (xs[base + 1] !== undefined) {
    return xs[base] + rest * (xs[base + 1] - xs[base]);
  }
  return xs[base];
}

export default function GoalFinder({ res }: { res: Results }) {
  const [targetPct, setTargetPct] = React.useState(80);

  const p = Math.min(Math.max(targetPct / 100, 0.01), 0.99);
  const goal = quantile(res.terminal, 1 - p);

  return (
    <Card className="bg-white/5">
      <SectionTitle
        title="Goal Finder"
        subtitle="Maximum target achievable at a given success probability"
      />

      <div className="grid grid-cols-12 gap-4 items-end">
        <div className="col-span-12 sm:col-span-4">
          <label className="text-xs text-zinc-400">
            Target success probability (%)
          </label>
          <Input
            type="number"
            min={1}
            max={99}
            step={1}
            value={targetPct}
            onChange={(e) => setTargetPct(Number(e.target.value))}
          />
        </div>

        <div className="col-span-12 sm:col-span-8">
          <div className="text-xs text-zinc-400">Implied goal (future ₹)</div>
          <div className="mt-1 text-2xl font-bold text-emerald-300">
            {inr(goal)}
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            P(terminal ≥ goal) ≈ {targetPct}%
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-zinc-500">
        Computed from Monte Carlo terminal wealth quantiles. No additional
        simulations required.
      </div>
    </Card>
  );
}
