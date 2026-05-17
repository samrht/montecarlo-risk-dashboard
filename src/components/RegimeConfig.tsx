import type { RegimeConfig } from "../engine/types";
import { Card, Input, Label, SectionTitle } from "./ui";

export default function RegimeConfigPanel({
  regimeConfig,
  onChange,
}: {
  regimeConfig: RegimeConfig;
  onChange: (r: RegimeConfig) => void;
}) {
  const pStayBull = (regimeConfig.pBullBull * 100).toFixed(0);
  const pStayBear = (regimeConfig.pBearBear * 100).toFixed(0);
  const avgBullDuration = regimeConfig.pBullBull < 1
    ? (1 / (1 - regimeConfig.pBullBull)).toFixed(1)
    : "∞";
  const avgBearDuration = regimeConfig.pBearBear < 1
    ? (1 / (1 - regimeConfig.pBearBear)).toFixed(1)
    : "∞";

  return (
    <Card className="bg-white/5">
      <div className="flex items-center justify-between">
        <SectionTitle
          title="Regime-Switching (Bull / Bear)"
          subtitle="Markets alternate between boom and bust via a Markov chain"
        />
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={regimeConfig.enabled}
            onChange={(e) => onChange({ ...regimeConfig, enabled: e.target.checked })}
            className="h-4 w-4 rounded accent-indigo-500"
          />
          <span className="text-xs text-zinc-300">Enable</span>
        </label>
      </div>

      {regimeConfig.enabled && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>P(stay bull) per month</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0.5}
                  max={0.999}
                  step={0.01}
                  value={regimeConfig.pBullBull}
                  onChange={(e) => onChange({ ...regimeConfig, pBullBull: Number(e.target.value) })}
                />
                <span className="text-xs text-zinc-400">{pStayBull}%</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">Avg bull run: ~{avgBullDuration} months</p>
            </div>
            <div>
              <Label>P(stay bear) per month</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0.5}
                  max={0.999}
                  step={0.01}
                  value={regimeConfig.pBearBear}
                  onChange={(e) => onChange({ ...regimeConfig, pBearBear: Number(e.target.value) })}
                />
                <span className="text-xs text-zinc-400">{pStayBear}%</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">Avg bear run: ~{avgBearDuration} months</p>
            </div>
            <div>
              <Label>Bear return shift (annual)</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={-0.5}
                  max={0}
                  step={0.01}
                  value={regimeConfig.bearReturnShift}
                  onChange={(e) => onChange({ ...regimeConfig, bearReturnShift: Number(e.target.value) })}
                />
                <span className="text-xs text-zinc-400">{(regimeConfig.bearReturnShift * 100).toFixed(0)}%</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">Returns reduced by this much in bear months</p>
            </div>
            <div>
              <Label>Bear volatility multiplier</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={1}
                  max={5}
                  step={0.1}
                  value={regimeConfig.bearVolMult}
                  onChange={(e) => onChange({ ...regimeConfig, bearVolMult: Number(e.target.value) })}
                />
                <span className="text-xs text-zinc-400">×</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">Vol scaled up in bear markets</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
