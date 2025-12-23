export type Asset = {
  name: string;
  muAnnual: number;
  sigmaAnnual: number;
  weight: number;
};

export type StressTest = {
  id: string;
  label: string;
  returnHaircut: number;
  volMultiplier: number;
};

export type RebalanceFreq = "none" | "monthly" | "quarterly" | "annual";
export type ReturnModel = "normal" | "t";

export type Config = {
  goalToday: number;
  years: number;
  inflationAnnual: number;

  lumpSum: number;
  sipMonthly: number;

  incomeMonthly?: number;
  sipCapPct: number;
  contribCapMonthly?: number;

  rebalanceFreq: RebalanceFreq;
  terAnnual: number;

  model: ReturnModel;
  df: number;

  nSims: number;
  seed: number;

  assets: Asset[];

  corr: number[][] | null;

  stressTests: StressTest[];
};

export type Results = {
  meta: {
    nSims: number;
    months: number;
    assets: string[];
    weights: number[];
    model: ReturnModel;
    df: number;
    rebalanceFreq: RebalanceFreq;
  };
  goalFuture: number;
  sipEffective: number;

  pSuccess: number;
  pFail: number;

  terminal: number[];
  mdd: number[];
  samplePaths: number[][];

  terminalPercentiles: Record<string, number>;
  mddPercentiles: Record<string, number>;

  var5: number;
  var1: number;
  cvar5: number;
  shortfall5: number;
};

export type WorkerMsg =
  | { type: "RUN"; config: Config; stress?: StressTest | null }
  | { type: "CANCEL" };

export type WorkerOut =
  | { type: "PROGRESS"; value: number }
  | { type: "DONE"; label: string; results: Results }
  | { type: "ERROR"; message: string };
