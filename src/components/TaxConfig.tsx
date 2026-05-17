import type { TaxConfig, Asset } from "../engine/types";
import { Card, Input, Label, SectionTitle } from "./ui";

export default function TaxConfigPanel({
  taxConfig,
  assets,
  onChange,
}: {
  taxConfig: TaxConfig;
  assets: Asset[];
  onChange: (t: TaxConfig) => void;
}) {
  const toggleEquity = (i: number) => {
    const s = new Set(taxConfig.equityAssetIndices);
    if (s.has(i)) s.delete(i); else s.add(i);
    onChange({ ...taxConfig, equityAssetIndices: [...s] });
  };

  return (
    <Card className="bg-white/5">
      <div className="flex items-center justify-between">
        <SectionTitle
          title="Tax Drag Modeling"
          subtitle="LTCG on equity annually, income tax on debt monthly"
        />
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={taxConfig.enabled}
            onChange={(e) => onChange({ ...taxConfig, enabled: e.target.checked })}
            className="h-4 w-4 rounded accent-indigo-500"
          />
          <span className="text-xs text-zinc-300">Enable</span>
        </label>
      </div>

      {taxConfig.enabled && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>LTCG rate (equity, annual)</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={taxConfig.ltcgRate}
                  onChange={(e) => onChange({ ...taxConfig, ltcgRate: Number(e.target.value) })}
                />
                <span className="text-xs text-zinc-400">{(taxConfig.ltcgRate * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div>
              <Label>Income tax rate (debt, monthly)</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={taxConfig.debtTaxRate}
                  onChange={(e) => onChange({ ...taxConfig, debtTaxRate: Number(e.target.value) })}
                />
                <span className="text-xs text-zinc-400">{(taxConfig.debtTaxRate * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          <div>
            <Label>Which assets are equity? (LTCG applies)</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {assets.map((a, i) => (
                <label key={i} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={taxConfig.equityAssetIndices.includes(i)}
                    onChange={() => toggleEquity(i)}
                    className="accent-indigo-500"
                  />
                  {a.name}
                </label>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-zinc-500">
              Unchecked assets are treated as debt — gains taxed monthly at income tax rate.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
