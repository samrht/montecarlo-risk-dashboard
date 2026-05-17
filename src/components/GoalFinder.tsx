import React from "react";
import type { Results } from "../engine/types";
import { Card, SectionTitle, Input } from "./ui";

function inr(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

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

const MIN_PCT = 1;
const MAX_PCT = 99;

export default function GoalFinder({ res }: { res: Results }) {
  const [raw, setRaw] = React.useState("80");

  const parsed = Number(raw);
  const isInvalid = isNaN(parsed) || raw.trim() === "";
  const clamped = Math.min(Math.max(parsed, MIN_PCT), MAX_PCT);
  const wasClamped = !isInvalid && clamped !== parsed;

  const p = clamped / 100;
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
            min={MIN_PCT}
            max={MAX_PCT}
            step={1}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onBlur={() => {
              // Snap display to clamped value on blur
              if (!isInvalid) setRaw(String(clamped));
            }}
          />
          {wasClamped && (
            <div className="mt-1 text-xs text-amber-400">
              Clamped to {clamped}% (valid range: {MIN_PCT}–{MAX_PCT}%)
            </div>
          )}
          {isInvalid && (
            <div className="mt-1 text-xs text-rose-400">
              Enter a number between {MIN_PCT} and {MAX_PCT}
            </div>
          )}
        </div>

        <div className="col-span-12 sm:col-span-8">
          <div className="text-xs text-zinc-400">Implied goal (future ₹)</div>
          {isInvalid ? (
            <div className="mt-1 text-2xl font-bold text-zinc-500">—</div>
          ) : (
            <>
              <div className="mt-1 text-2xl font-bold text-emerald-300">
                {inr(goal)}
              </div>
              <div className="mt-1 text-xs text-zinc-400">
                P(terminal ≥ goal) ≈ {clamped}%
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 text-xs text-zinc-500">
        Computed from Monte Carlo terminal wealth quantiles. No additional
        simulations required.
      </div>
    </Card>
  );
}
