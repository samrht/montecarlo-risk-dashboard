export function normalizeWeights(w: number[]) {
  const s = w.reduce((acc, v) => acc + Math.max(0, v), 0);
  if (s <= 0) return w.map(() => 1 / w.length);
  return w.map((v) => Math.max(0, v) / s);
}

export function annualToMonthly(muA: number, sigmaA: number) {
  return { muM: muA / 12, sigmaM: sigmaA / Math.sqrt(12) };
}

export function percentile(arr: number[], p: number) {
  if (arr.length === 0) return NaN;
  const a = [...arr].sort((x, y) => x - y);
  const idx = (p / 100) * (a.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  const w = idx - lo;
  return a[lo] * (1 - w) + a[hi] * w;
}

export function percentiles(arr: number[], ps: number[]) {
  const out: Record<string, number> = {};
  for (const p of ps) out[String(p)] = percentile(arr, p);
  return out;
}

export function mean(arr: number[]) {
  if (arr.length === 0) return NaN;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function cvarLower(arr: number[], alpha: number) {
  const q = percentile(arr, alpha * 100);
  const tail = arr.filter((x) => x <= q);
  return mean(tail);
}

export function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function rand() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function randn(rand: () => number) {
  let u = 0,
    v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function randChiSquare(rand: () => number, df: number) {
  let s = 0;
  for (let i = 0; i < df; i++) {
    const z = randn(rand);
    s += z * z;
  }
  return s;
}

export function cholesky(A: number[][]) {
  const n = A.length;
  const L: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) sum += L[i][k] * L[j][k];
      if (i === j) {
        const v = A[i][i] - sum;
        L[i][j] = v > 0 ? Math.sqrt(v) : 0;
      } else {
        const denom = L[j][j] || 1e-12;
        L[i][j] = (A[i][j] - sum) / denom;
      }
    }
  }
  return L;
}

export function matVec(L: number[][], x: number[]) {
  const n = L.length;
  const out = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let k = 0; k <= i; k++) s += L[i][k] * x[k];
    out[i] = s;
  }
  return out;
}
