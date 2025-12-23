import { useRef } from "react";
import type { Config, Results } from "../../engine/types";
import ResultsPanel from "../ResultsPanel";
import ScenarioCompare from "../ScenarioCompare";
import FeasibilityCurve from "../FeasibilityCurve";
import GoalFinder from "../GoalFinder";
import SensitivityTornado from "../SensitivityTornado";
import ActionEngine from "../ActionEngine";
import RobustnessBox from "../RobustnessBox";
import { Button } from "../ui";
import { exportDashboardPdf } from "../../utils/exportPdf";

export default function DashboardView({
  cfg,
  baseRes,
  stressRes,
}: {
  cfg: Config;
  baseRes: Results | null;
  stressRes: { label: string; res: Results }[];
}) {
  const ref = useRef<HTMLDivElement>(null);

  if (!baseRes) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
        Run a simulation to see results.
      </div>
    );
  }

  return (
    <>
      {/* Export */}
      <div className="mb-3 flex justify-end">
        <Button
          variant="primary"
          onClick={() => {
            if (ref.current) exportDashboardPdf(ref.current);
          }}
        >
          Export PDF
        </Button>
      </div>

      {/* Dashboard content */}
      <div ref={ref} className="space-y-4">
        {/* Action layer (the “tell me what to do” part) */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 xl:col-span-6">
            <ActionEngine cfg={cfg} base={baseRes} />
          </div>
          <div className="col-span-12 xl:col-span-6">
            <RobustnessBox cfg={cfg} base={baseRes} />
          </div>
        </div>

        {/* Decision layer */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 xl:col-span-6">
            <ScenarioCompare base={baseRes} stress={stressRes} />
          </div>

          <div className="col-span-12 xl:col-span-6 space-y-4">
            <GoalFinder res={baseRes} />
            <FeasibilityCurve base={baseRes} stress={stressRes} />
          </div>
        </div>

        {/* Sensitivity */}
        <SensitivityTornado base={baseRes} />

        {/* Detailed outputs */}
        <ResultsPanel label="Base" res={baseRes} />
        {stressRes.map((s) => (
          <ResultsPanel key={s.label} label={s.label} res={s.res} />
        ))}
      </div>
    </>
  );
}
