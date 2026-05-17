import { Button, Pill } from "../ui";

export default function Topbar({
  running,
  progress,
  onRun,
  onCancel,
  onExport,
  onImport,
}: {
  running: boolean;
  progress: number;
  onRun: () => void;
  onCancel: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}) {
  const pct = Math.round(progress * 100);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Pill>
            {running ? `Running • ${pct}%` : "Idle"}
          </Pill>
          <div className="hidden text-xs text-zinc-400 md:block">
            In-browser compute via Web Workers
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={onExport} disabled={running}>Export JSON</Button>

          <label className={`cursor-pointer ${running ? "pointer-events-none opacity-50" : ""}`}>
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])}
            />
            {/* Match ghost Button styling exactly */}
            <span className="inline-block rounded-xl bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 dark:bg-white/10 dark:text-zinc-100 dark:hover:bg-white/15 transition-all">
              Import JSON
            </span>
          </label>

          {!running ? (
            <Button variant="primary" onClick={onRun}>
              ▶ Run Simulation
            </Button>
          ) : (
            <Button variant="danger" onClick={onCancel}>
              ✕ Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar — always present, animates in when running */}
      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-300"
          style={{ width: running ? `${pct}%` : progress === 1 ? "100%" : "0%" }}
        />
      </div>
    </div>
  );
}
