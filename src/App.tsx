import { useMemo, useState } from "react";
import type { Config, Results, StressTest } from "./engine/types";
import { runSimulationInWorker } from "./engine/simClient";
import Sidebar, { type NavKey } from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import BuilderView from "./components/views/BuilderView";
import DashboardView from "./components/views/DashboardView";

const DEFAULT: Config = {
  goalToday: 2500000,
  years: 10,
  inflationAnnual: 0.06,
  lumpSum: 200000,
  sipMonthly: 15000,
  incomeMonthly: 60000,
  sipCapPct: 0.3,
  contribCapMonthly: 20000,
  rebalanceFreq: "annual",
  terAnnual: 0.006,
  model: "t",
  df: 6,
  nSims: 30000,
  seed: 7,
  assets: [
    { name: "Equity", muAnnual: 0.12, sigmaAnnual: 0.2, weight: 0.7 },
    { name: "Debt", muAnnual: 0.07, sigmaAnnual: 0.07, weight: 0.2 },
    { name: "Gold", muAnnual: 0.06, sigmaAnnual: 0.15, weight: 0.1 },
  ],
  corr: [
    [1, 0.2, 0.1],
    [0.2, 1, 0.05],
    [0.1, 0.05, 1],
  ],
  stressTests: [
    {
      id: crypto.randomUUID(),
      label: "Stress: -2% returns, 1.5x vol",
      returnHaircut: 0.02,
      volMultiplier: 1.5,
    },
  ],
};

type StressRow = { label: string; res: Results };

export default function App() {
  const [nav, setNav] = useState<NavKey>("builder");
  const [cfg, setCfg] = useState<Config>(DEFAULT);

  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [baseRes, setBaseRes] = useState<Results | null>(null);
  const [stressRes, setStressRes] = useState<StressRow[]>([]);

  const [cancelRun, setCancelRun] = useState<null | (() => void)>(null);

  // ✅ actually use it (no weird "useMemo but ignore result" junk)
  const assetNames = useMemo(() => cfg.assets.map((a) => a.name), [cfg.assets]);
  void assetNames; // if you don't use assetNames anywhere else, remove this AND the memo.

  const exportConfig = () => {
    const blob = new Blob([JSON.stringify(cfg, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "config.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = async (file: File) => {
    const txt = await file.text();
    setCfg(JSON.parse(txt) as Config);
  };

  const cancel = () => {
    cancelRun?.();
    setRunning(false);
    setCancelRun(null);
  };

  const runAll = async () => {
    setError(null);
    setProgress(0);
    setRunning(true);
    setBaseRes(null);
    setStressRes([]);

    // Build a job list: Base + each stress
    const jobs: { label: string; stress: StressTest | null }[] = [
      { label: "Base", stress: null },
      ...cfg.stressTests.map((st) => ({ label: st.label, stress: st })),
    ];

    const total = jobs.length;

    try {
      for (let idx = 0; idx < total; idx++) {
        const job = jobs[idx];

        const { promise, cancel: cancelThis } = runSimulationInWorker({
          config: cfg,
          stress: job.stress,
          onProgress: (p) => {
            // overall progress = completed jobs + progress of current job
            const overall = (idx + p) / total;
            setProgress(overall);
          },
          timeoutMs: 120_000,
        });

        setCancelRun(() => cancelThis);

        const out = await promise;

        if (out.label === "Base") {
          setBaseRes(out.results);
        } else {
          setStressRes((prev) => [
            ...prev,
            { label: out.label, res: out.results },
          ]);
        }
      }

      setProgress(1);
      setNav("dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setRunning(false);
      setCancelRun(null);
    }
  };

  return (
    <div className="relative min-h-screen text-zinc-100">
      {/* background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 space-bg" />
        <div className="stars stars-1" />
        <div className="stars stars-2" />
        <div className="absolute -left-[10%] -top-[10%] h-[520px] w-[520px] rounded-full bg-indigo-500/25 blur-3xl blob blob-1" />
        <div className="absolute -right-[10%] top-[10%] h-[520px] w-[520px] rounded-full bg-cyan-500/20 blur-3xl blob blob-2" />
        <div className="absolute left-[30%] -bottom-[10%] h-[520px] w-[520px] rounded-full bg-violet-500/20 blur-3xl blob blob-3" />
      </div>

      <div className="grid h-screen grid-cols-12">
        <aside className="col-span-12 border-b border-white/10 md:col-span-3 md:border-b-0 md:border-r xl:col-span-2">
          <Sidebar active={nav} onNav={setNav} />
        </aside>

        <div className="col-span-12 flex h-full flex-col md:col-span-9 xl:col-span-10">
          <div className="p-4">
            <Topbar
              running={running}
              progress={progress}
              onRun={runAll}
              onCancel={cancel}
              onExport={exportConfig}
              onImport={importConfig}
            />

            {error && (
              <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            )}
          </div>

          <main className="flex-1 overflow-auto px-4 pb-6">
            <div className="animate-fade-in">
              {nav === "builder" ? (
                <BuilderView cfg={cfg} setCfg={setCfg} />
              ) : (
                <DashboardView
                  baseRes={baseRes}
                  stressRes={stressRes}
                  cfg={cfg}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
