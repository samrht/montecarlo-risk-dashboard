import type { GlidePath, Asset } from "../engine/types";
import { Card, Input, SectionTitle } from "./ui";
import { normalizeWeights } from "../engine/math";

export default function GlidePathConfig({
  glidePath,
  assets,
  onChange,
}: {
  glidePath: GlidePath;
  assets: Asset[];
  onChange: (g: GlidePath) => void;
}) {
  const n = assets.length;
  const endW =
    glidePath.endWeights.length === n
      ? glidePath.endWeights
      : assets.map(() => 1 / n);

  const totalStart = assets.reduce((s, a) => s + Math.max(0, a.weight), 0) || 1;
  const normStart = assets.map((a) => Math.max(0, a.weight) / totalStart);
  const normEnd = normalizeWeights(endW);

  const setEndWeight = (i: number, v: number) => {
    const next = [...endW];
    next[i] = v;
    onChange({ ...glidePath, endWeights: next });
  };

  return (
    <Card className="bg-white/5">
      <div className="flex items-center justify-between">
        <SectionTitle
          title="Glide-Path Allocation"
          subtitle="Linearly shift portfolio weights toward target over the horizon"
        />
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={glidePath.enabled}
            onChange={(e) => onChange({ ...glidePath, enabled: e.target.checked })}
            className="h-4 w-4 rounded accent-indigo-500"
          />
          <span className="text-xs text-zinc-300">Enable</span>
        </label>
      </div>

      {glidePath.enabled && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-zinc-400 mb-3">
            Portfolio starts at current weights (left) and linearly moves to target weights (right) by end of horizon.
          </p>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-4 gap-y-2">
            <span className="text-xs font-medium text-zinc-400 text-center">Start weight (current)</span>
            <span className="text-xs text-zinc-500"></span>
            <span className="text-xs font-medium text-zinc-400 text-center">End weight (target)</span>

            {assets.map((a, i) => (
              <div key={i} className="contents">
                <div className="flex items-center gap-2">
                  <span className="w-16 truncate text-xs text-zinc-300">{a.name}</span>
                  <span className="flex-1 rounded bg-white/10 px-2 py-1 text-xs text-zinc-300 text-right">
                    {(normStart[i] * 100).toFixed(1)}%
                  </span>
                </div>
                <span className="text-center text-zinc-500 text-xs">→</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={endW[i]}
                    onChange={(e) => setEndWeight(i, Number(e.target.value))}
                    className="flex-1 text-right text-xs"
                  />
                  <span className="w-10 text-xs text-zinc-400 text-right">
                    {(normEnd[i] * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            End weights are auto-normalised. Enter any positive values.
          </p>
        </div>
      )}
    </Card>
  );
}
