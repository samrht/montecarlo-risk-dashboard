/// <reference lib="webworker" />
import type { WorkerMsg, WorkerOut } from "./types";
import { runMonteCarlo } from "./compute";

let cancelled = false;

self.onmessage = (e: MessageEvent<WorkerMsg>) => {
  const msg = e.data;

  if (msg.type === "CANCEL") {
    cancelled = true;
    return;
  }

  if (msg.type === "RUN") {
    cancelled = false;
    try {
      const label = msg.stress ? msg.stress.label : "Base";
      const results = runMonteCarlo(
        msg.config,
        msg.stress ?? null,
        (p) =>
          self.postMessage({ type: "PROGRESS", value: p } satisfies WorkerOut),
        () => cancelled
      );

      self.postMessage({ type: "DONE", label, results } satisfies WorkerOut);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      self.postMessage({ type: "ERROR", message } satisfies WorkerOut);
    }
  }
};
