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

// ── New feature types (all optional on Config) ─────────────────────────────

/** Glide-path: linearly shift weights from current → endWeights over horizon */
export type GlidePath = {
  enabled: boolean;
  endWeights: number[];
};

/** Tax drag: LTCG on equity assets annually, income tax on debt monthly */
export type TaxConfig = {
  enabled: boolean;
  ltcgRate: number;       // e.g. 0.10 for 10%
  stcgRate: number;       // short-term (unused in monthly model but stored)
  debtTaxRate: number;    // e.g. 0.30 for 30% income-tax slab on debt gains
  equityAssetIndices: number[];  // which asset indices are equity
};

/** Regime-switching: two-state Markov chain (bull / bear) */
export type RegimeConfig = {
  enabled: boolean;
  pBullBull: number;      // P(stay bull | bull), e.g. 0.97
  pBearBear: number;      // P(stay bear | bear), e.g. 0.80
  bearReturnShift: number; // annual shift applied in bear, e.g. -0.08
  bearVolMult: number;    // vol multiplier in bear, e.g. 1.5
};

/** Panic behavior: pause SIP when portfolio drawdown exceeds threshold */
export type PanicConfig = {
  enabled: boolean;
  threshold: number;      // drawdown magnitude that triggers pause, e.g. 0.20
  pauseMonths: number;    // how many months SIP stays paused, e.g. 6
};

// ──────────────────────────────────────────────────────────────────────────

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

  // Advanced features (all optional — disabled by default)
  glidePath?: GlidePath;
  taxConfig?: TaxConfig;
  regimeConfig?: RegimeConfig;
  panicConfig?: PanicConfig;
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
