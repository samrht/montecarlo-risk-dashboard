import type { Config } from "./types";
import type { ActionItem } from "./action.worker";

export type ActionResult = {
  items: ActionItem[];
  usedNSims: number;
};

type ActionMsg = {
  type: "actions";
  id: string;
  cfg: Config;
  targets: number[];
  capSims?: number;
  sipRoundTo?: number;
};

type ActionOut =
  | { type: "actions_done"; id: string; result: ActionResult }
  | { type: "error"; id: string; message: string };

let worker: Worker | null = null;

const pending = new Map<
  string,
  { resolve: (r: ActionResult) => void; reject: (e: Error) => void }
>();

function getWorker() {
  if (worker) return worker;

  worker = new Worker(new URL("./action.worker.ts", import.meta.url), {
    type: "module",
  });

  worker.onmessage = (ev: MessageEvent<ActionOut>) => {
    const msg = ev.data;
    const p = pending.get(msg.id);
    if (!p) return;

    if (msg.type === "actions_done") {
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

export function runActions(
  cfg: Config,
  targets: number[] = [0.7, 0.8, 0.9],
  capSims = 2000,
  sipRoundTo = 500
): Promise<ActionResult> {
  const w = getWorker();
  const id = uid();

  const msg: ActionMsg = {
    type: "actions",
    id,
    cfg,
    targets,
    capSims,
    sipRoundTo,
  };

  return new Promise<ActionResult>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage(msg);
  });
}
