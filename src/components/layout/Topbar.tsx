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
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-2">
        <Pill>
          {running ? `Running • ${Math.round(progress * 100)}%` : "Idle"}
        </Pill>
        <div className="hidden text-xs text-zinc-400 md:block">
          In-browser compute via Web Worker
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onExport}>Export</Button>

        <label className="cursor-pointer">
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])}
          />
          <span className="inline-block rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-white/15">
            Import
          </span>
        </label>

        {!running ? (
          <Button variant="primary" onClick={onRun}>
            Run Simulation
          </Button>
        ) : (
          <Button variant="danger" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
