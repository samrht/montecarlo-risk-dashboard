import type { Config, ReturnModel, RebalanceFreq } from "../../engine/types";
import { Card, Input, Label, SectionTitle, Select } from "../ui";
import AssetsTable from "../AssetsTable";
import CorrMatrix from "../CorrMatrix";
import StressTests from "../StressTests";
import AllocDonut from "../widgets/AllocDonut";

const RETURN_MODELS: ReturnModel[] = ["normal", "t"];
const REBALANCE_FREQS: RebalanceFreq[] = [
  "none",
  "monthly",
  "quarterly",
  "annual",
];

export default function BuilderView({
  cfg,
  setCfg,
}: {
  cfg: Config;
  setCfg: (c: Config) => void;
}) {
  return (
    <div className="animate-fade-in grid grid-cols-12 gap-4">
      {/* Left column: Goal + Model */}
      <div className="col-span-12 space-y-4 xl:col-span-7">
        <Card className="bg-white/5">
          <SectionTitle
            title="Goal & Cashflows"
            subtitle="Inflation-adjusted target + contribution constraints"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Goal (today ₹)</Label>
              <Input
                type="number"
                value={cfg.goalToday}
                onChange={(e) =>
                  setCfg({ ...cfg, goalToday: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Horizon (years)</Label>
              <Input
                type="number"
                step="0.5"
                value={cfg.years}
                onChange={(e) =>
                  setCfg({ ...cfg, years: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Inflation (annual)</Label>
              <Input
                type="number"
                step="0.01"
                value={cfg.inflationAnnual}
                onChange={(e) =>
                  setCfg({ ...cfg, inflationAnnual: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Lump sum (₹)</Label>
              <Input
                type="number"
                value={cfg.lumpSum}
                onChange={(e) =>
                  setCfg({ ...cfg, lumpSum: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>SIP monthly (₹)</Label>
              <Input
                type="number"
                value={cfg.sipMonthly}
                onChange={(e) =>
                  setCfg({ ...cfg, sipMonthly: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Income monthly (₹)</Label>
              <Input
                type="number"
                value={cfg.incomeMonthly ?? ""}
                onChange={(e) =>
                  setCfg({
                    ...cfg,
                    incomeMonthly:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <Label>SIP cap % of income</Label>
              <Input
                type="number"
                step="0.01"
                value={cfg.sipCapPct}
                onChange={(e) =>
                  setCfg({ ...cfg, sipCapPct: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Contribution cap (₹)</Label>
              <Input
                type="number"
                value={cfg.contribCapMonthly ?? ""}
                onChange={(e) =>
                  setCfg({
                    ...cfg,
                    contribCapMonthly:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
        </Card>

        <Card className="bg-white/5">
          <SectionTitle
            title="Model & Strategy"
            subtitle="Return distribution, rebalancing, fees, simulation controls"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Return model</Label>
              <Select
                value={cfg.model}
                onChange={(e) =>
                  setCfg({ ...cfg, model: e.target.value as ReturnModel })
                }
              >
                {RETURN_MODELS.map((m) => (
                  <option key={m} value={m}>
                    {m === "normal" ? "Normal" : "Student-t (fat tails)"}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>df (only for t)</Label>
              <Input
                type="number"
                value={cfg.df}
                onChange={(e) => setCfg({ ...cfg, df: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Rebalancing</Label>
              <Select
                value={cfg.rebalanceFreq}
                onChange={(e) =>
                  setCfg({
                    ...cfg,
                    rebalanceFreq: e.target.value as RebalanceFreq,
                  })
                }
              >
                {REBALANCE_FREQS.map((r) => (
                  <option key={r} value={r}>
                    {r[0].toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>TER (annual)</Label>
              <Input
                type="number"
                step="0.001"
                value={cfg.terAnnual}
                onChange={(e) =>
                  setCfg({ ...cfg, terAnnual: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Simulations</Label>
              <Input
                type="number"
                value={cfg.nSims}
                onChange={(e) =>
                  setCfg({ ...cfg, nSims: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Seed</Label>
              <Input
                type="number"
                value={cfg.seed}
                onChange={(e) =>
                  setCfg({ ...cfg, seed: Number(e.target.value) })
                }
              />
            </div>
          </div>
        </Card>

        <AssetsTable
          assets={cfg.assets}
          onChange={(assets) => setCfg({ ...cfg, assets, corr: null })}
        />
      </div>

      {/* Right column: allocation + corr + stress */}
      <div className="col-span-12 space-y-4 xl:col-span-5">
        <AllocDonut assets={cfg.assets} />
        <CorrMatrix
          assetNames={cfg.assets.map((a) => a.name)}
          corr={cfg.corr}
          onChange={(corr) => setCfg({ ...cfg, corr })}
        />
        <StressTests
          stressTests={cfg.stressTests}
          onChange={(stressTests) => setCfg({ ...cfg, stressTests })}
        />
      </div>
    </div>
  );
}
