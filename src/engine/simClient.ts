import type { WorkerMsg, WorkerOut, Config, Results } from "./types";

export function runSimulationInWorker(opts: {
  config: Config;
  stress?: { label: string; id: string; returnHaircut: number; volMultiplier: number } | null;
  onProgress?: (p: number) => void;
  timeoutMs?: number;
}): {
  promise: Promise<{ label: string; results: Results }>;
  cancel: () => void;
} {
  const w = new Worker(new URL("./worker.ts", import.meta.url), {
    type: "module",
  });
  const timeoutMs = opts.timeoutMs ?? 60_000;

  let done = false;

  const cancel = () => {
    if (done) return;
    const msg = { type: "CANCEL" } satisfies WorkerMsg;
    w.postMessage(msg);
  };

  const safeTerminate = () => {
    try {
      w.terminate();
    } catch (err) {

      console.error("Worker terminate failed:", err);
    }
  };

  const promise = new Promise<{ label: string; results: Results }>(
    (resolve, reject) => {
      const timer = window.setTimeout(() => {
        if (done) return;
        done = true;

        try {
          cancel();
        } catch (err) {

          console.error("Cancel postMessage failed:", err);
        }

        safeTerminate();
        reject(new Error("Simulation timed out (worker did not respond)."));
      }, timeoutMs);

      w.onerror = (ev) => {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        safeTerminate();

        console.error("Worker error:", ev);
        reject(new Error("Worker crashed while running simulation."));
      };

      w.onmessageerror = (ev) => {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        safeTerminate();

        console.error("Worker messageerror:", ev);
        reject(new Error("Worker message deserialization failed."));
      };

      w.onmessage = (ev: MessageEvent<WorkerOut>) => {
        const msg = ev.data;

        if (msg.type === "PROGRESS") {
          opts.onProgress?.(msg.value);
          return;
        }

        if (msg.type === "DONE") {
          if (done) return;
          done = true;
          window.clearTimeout(timer);
          safeTerminate();
          resolve({ label: msg.label, results: msg.results });
          return;
        }

        if (msg.type === "ERROR") {
          if (done) return;
          done = true;
          window.clearTimeout(timer);
          safeTerminate();
          reject(new Error(msg.message));
        }
      };

      const run = {
        type: "RUN",
        config: opts.config,
        stress: opts.stress ?? null,
      } satisfies WorkerMsg;

      w.postMessage(run);
    }
  );

  return { promise, cancel };
}
