import type { Config } from "./types";
import type { TornadoRow } from "./sensitivity.worker";

type SensitivityOut =
  | { type: "sensitivity_done"; id: string; rows: TornadoRow[]; pBase: number }
  | { type: "error"; id: string; message: string };

type SensitivityMsg = {
  type: "sensitivity";
  id: string;
  cfg: Config;
  capSims?: number;
};

let worker: Worker | null = null;

const pending = new Map<
  string,
  {
    resolve: (r: { rows: TornadoRow[]; pBase: number }) => void;
    reject: (e: Error) => void;
  }
>();

function getWorker() {
  if (worker) return worker;

  worker = new Worker(
    new URL("./sensitivity.worker.ts", import.meta.url),
    { type: "module" }
  );

  worker.onmessage = (ev: MessageEvent<SensitivityOut>) => {
    const msg = ev.data;
    const p = pending.get(msg.id);
    if (!p) return;

    if (msg.type === "sensitivity_done") {
      pending.delete(msg.id);
      p.resolve({ rows: msg.rows, pBase: msg.pBase });
      return;
    }

    if (msg.type === "error") {
      pending.delete(msg.id);
      p.reject(new Error(msg.message));
    }
  };

  return worker;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function runSensitivity(
  cfg: Config,
  capSims = 3000
): Promise<{ rows: TornadoRow[]; pBase: number }> {
  const w = getWorker();
  const id = uid();

  const msg: SensitivityMsg = { type: "sensitivity", id, cfg, capSims };

  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage(msg);
  });
}
