import type { Config } from "./types";

export type RobustnessResult = {
  level: "Robust" | "Sensitive" | "Fragile";
  color: "🟢" | "🟡" | "🔴";
  drop: number;
  base: number;
  stressed: number[];
};

type RobustnessMsg = {
  type: "robustness";
  id: string;
  cfg: Config;
  capSims?: number;
};

type RobustnessOut =
  | { type: "robustness_done"; id: string; result: RobustnessResult }
  | { type: "error"; id: string; message: string };

let worker: Worker | null = null;

const pending = new Map<
  string,
  { resolve: (r: RobustnessResult) => void; reject: (e: Error) => void }
>();

function getWorker() {
  if (worker) return worker;

  worker = new Worker(new URL("./robustness.worker.ts", import.meta.url), {
    type: "module",
  });

  worker.onmessage = (ev: MessageEvent<RobustnessOut>) => {
    const msg = ev.data;
    const p = pending.get(msg.id);
    if (!p) return;

    if (msg.type === "robustness_done") {
      pending.delete(msg.id);
      p.resolve(msg.result);
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

export function runRobustness(
  cfg: Config,
  capSims = 2500
): Promise<RobustnessResult> {
  const w = getWorker();
  const id = uid();

  const msg: RobustnessMsg = { type: "robustness", id, cfg, capSims };

  return new Promise<RobustnessResult>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage(msg);
  });
}
