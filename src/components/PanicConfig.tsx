import type { PanicConfig } from "../engine/types";
import { Card, Input, Label, SectionTitle } from "./ui";

export default function PanicConfigPanel({
  panicConfig,
  onChange,
}: {
  panicConfig: PanicConfig;
  onChange: (p: PanicConfig) => void;
}) {
  return (
    <Card className="bg-white/5">
      <div className="flex items-center justify-between">
        <SectionTitle
          title="Behavioral Risk — Panic Selling"
          subtitle="Simulate SIP pause when portfolio drops sharply from peak"
        />
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={panicConfig.enabled}
            onChange={(e) => onChange({ ...panicConfig, enabled: e.target.checked })}
            className="h-4 w-4 rounded accent-indigo-500"
          />
          <span className="text-xs text-zinc-300">Enable</span>
        </label>
      </div>

      {panicConfig.enabled && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Drawdown threshold (%)</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={1}
                  max={80}
                  step={1}
                  value={Math.round(panicConfig.threshold * 100)}
                  onChange={(e) =>
                    onChange({ ...panicConfig, threshold: Number(e.target.value) / 100 })
                  }
                />
                <span className="text-xs text-zinc-400">%</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                SIP pauses when portfolio drops ≥{Math.round(panicConfig.threshold * 100)}% from its peak
              </p>
            </div>
            <div>
              <Label>Pause duration (months)</Label>
              <Input
                type="number"
                min={1}
                max={60}
                step={1}
                value={panicConfig.pauseMonths}
                onChange={(e) => onChange({ ...panicConfig, pauseMonths: Number(e.target.value) })}
              />
              <p className="text-[11px] text-zinc-500 mt-0.5">
                SIP stays stopped for {panicConfig.pauseMonths} month{panicConfig.pauseMonths !== 1 ? "s" : ""} after trigger
              </p>
            </div>
          </div>
          <p className="text-[11px] text-amber-400/80 bg-amber-500/10 rounded-lg px-2.5 py-1.5">
            ⚠ This models irrational investor behavior — enabling it will reduce P(success) by simulating missed contributions during downturns.
          </p>
        </div>
      )}
    </Card>
  );
}
