import type { Results } from "../engine/types";
import { Card } from "./ui";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  ReferenceLine,
} from "recharts";

const COLORS = {
  terminal: "#818cf8",
  drawdown: "#fbbf24",
  paths: ["#22d3ee", "#a78bfa", "#34d399", "#f472b6", "#fb7185", "#fbbf24"],
};

function hist(data: number[], bins: number) {
  if (data.length === 0) return [];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const w = (max - min) / bins || 1;
  const counts = new Array(bins).fill(0);
  for (const x of data) {
    const idx = Math.min(bins - 1, Math.max(0, Math.floor((x - min) / w)));
    counts[idx]++;
  }
  return counts.map((c, i) => ({ x: min + i * w, y: c }));
}

function formatINR(n: number) {
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function formatPct(n: number) {
  return (n * 100).toFixed(1) + "%";
}

type TooltipPayloadItem = { name?: string; value?: number | string };

function GlassTooltip({
  active,
  label,
  payload,
  labelFormatter,
  valueFormatter,
}: {
  active?: boolean;
  label?: unknown;
  payload?: TooltipPayloadItem[];
  labelFormatter: (label: unknown) => string;
  valueFormatter: (value: number, name?: string) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0];
  const raw = p.value;
  const value =
    typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/90 px-3 py-2 shadow-xl backdrop-blur-md">
      <div className="text-xs font-semibold text-zinc-200">
        {labelFormatter(label)}
      </div>
      <div className="mt-1 text-sm text-zinc-100">
        <span className="font-medium">{p.name ?? "Value"}:</span>{" "}
        <span className="font-semibold">
          {Number.isFinite(value) ? valueFormatter(value, p.name) : "—"}
        </span>
      </div>
    </div>
  );
}

function PathTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: unknown;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/90 px-3 py-2 shadow-xl backdrop-blur-md">
      <div className="text-xs font-semibold text-zinc-200 mb-1">
        Month {String(label)}
      </div>
      {payload.map((p, i) => {
        const v = typeof p.value === "number" ? p.value : NaN;
        return (
          <div key={i} className="text-xs text-zinc-300">
            {p.name}: {Number.isFinite(v) ? formatINR(v) : "—"}
          </div>
        );
      })}
    </div>
  );
}

const gridStyle = { stroke: "rgba(255,255,255,0.06)" };
const axisStyle = { fill: "#a1a1aa", fontSize: 11 };

export default function ResultsPanel({ label, res }: { label: string; res: Results }) {
  const termHist = hist(res.terminal, 40);
  const ddHist = hist(res.mdd.map((d) => Math.abs(d)), 40);
  const show = res.samplePaths.slice(0, 6);

  const pathData: Record<string, number>[] =
    show.length === 0
      ? []
      : show[0].map((_, t) => {
          const row: Record<string, number> = { t };
          show.forEach((p, i) => (row[`Path ${i + 1}`] = p[t]));
          return row;
        });

  // Derived KPIs
  const successColor =
    res.pSuccess >= 0.8
      ? "text-emerald-300"
      : res.pSuccess >= 0.5
      ? "text-amber-300"
      : "text-rose-300";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-zinc-200">{label} Scenario</div>
        <div className="text-xs text-zinc-400">
          {res.meta.nSims.toLocaleString()} simulations ·{" "}
          {res.meta.months} months
        </div>
      </div>

      {/* KPI row — 4 tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="bg-white/5 !hover:translate-y-0">
          <div className="text-xs text-zinc-400">P(success)</div>
          <div className={`mt-1 text-2xl font-bold ${successColor}`}>
            {(res.pSuccess * 100).toFixed(1)}%
          </div>
          <div className="mt-0.5 text-xs text-zinc-500">
            P(fail) {(res.pFail * 100).toFixed(1)}%
          </div>
        </Card>

        <Card className="bg-white/5">
          <div className="text-xs text-zinc-400">Median outcome</div>
          <div className="mt-1 text-2xl font-bold text-zinc-100">
            {formatINR(res.terminalPercentiles["50"] ?? 0)}
          </div>
          <div className="mt-0.5 text-xs text-zinc-500">
            Goal {formatINR(res.goalFuture)}
          </div>
        </Card>

        <Card className="bg-white/5">
          <div className="text-xs text-zinc-400">VaR 5%</div>
          <div className="mt-1 text-2xl font-bold text-rose-300">
            {formatINR(res.var5)}
          </div>
          <div className="mt-0.5 text-xs text-zinc-500">
            CVaR {formatINR(res.cvar5)}
          </div>
        </Card>

        <Card className="bg-white/5">
          <div className="text-xs text-zinc-400">Median drawdown</div>
          <div className="mt-1 text-2xl font-bold text-amber-300">
            {formatPct(Math.abs(res.mddPercentiles["50"] ?? 0))}
          </div>
          <div className="mt-0.5 text-xs text-zinc-500">
            Worst 5% {formatPct(Math.abs(res.mddPercentiles["5"] ?? 0))}
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-12 gap-4">
        {/* Terminal wealth distribution */}
        <Card className="col-span-12 lg:col-span-6 bg-white/5">
          <div className="mb-2 text-sm font-semibold text-zinc-200">
            Terminal Wealth Distribution
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={termHist} margin={{ left: 0, right: 8 }}>
                <CartesianGrid vertical={false} stroke={gridStyle.stroke} />
                <XAxis
                  dataKey="x"
                  tickFormatter={(v: number) => formatINR(v)}
                  tick={axisStyle}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                <ReferenceLine
                  x={res.goalFuture}
                  stroke="#34d399"
                  strokeDasharray="4 3"
                  label={{ value: "Goal", fill: "#34d399", fontSize: 10, position: "insideTopRight" }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.06)" }}
                  content={
                    <GlassTooltip
                      labelFormatter={(l) =>
                        typeof l === "number" ? formatINR(l) : String(l)
                      }
                      valueFormatter={(v) =>
                        Math.round(v).toLocaleString("en-IN") + " paths"
                      }
                    />
                  }
                />
                <Bar dataKey="y" name="Paths" fill={COLORS.terminal} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Max drawdown distribution */}
        <Card className="col-span-12 lg:col-span-6 bg-white/5">
          <div className="mb-2 text-sm font-semibold text-zinc-200">
            Max Drawdown Distribution
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ddHist} margin={{ left: 0, right: 8 }}>
                <CartesianGrid vertical={false} stroke={gridStyle.stroke} />
                <XAxis
                  dataKey="x"
                  tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                  tick={axisStyle}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.06)" }}
                  content={
                    <GlassTooltip
                      labelFormatter={(l) =>
                        typeof l === "number"
                          ? `${(l * 100).toFixed(1)}% drawdown`
                          : String(l)
                      }
                      valueFormatter={(v) =>
                        Math.round(v).toLocaleString("en-IN") + " paths"
                      }
                    />
                  }
                />
                <Bar dataKey="y" name="Paths" fill={COLORS.drawdown} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Sample paths */}
        {pathData.length > 0 && (
          <Card className="col-span-12 bg-white/5">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold text-zinc-200">
                Sample Paths ({show.length} of {res.meta.nSims.toLocaleString()})
              </div>
              <div className="text-xs text-zinc-500">
                Goal line in green
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pathData} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid stroke={gridStyle.stroke} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="t"
                    tick={axisStyle}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: "Month", position: "insideBottomRight", fill: "#71717a", fontSize: 10, offset: -4 }}
                  />
                  <YAxis
                    tickFormatter={(v: number) => formatINR(v)}
                    tick={axisStyle}
                    axisLine={false}
                    tickLine={false}
                    width={72}
                  />
                  <ReferenceLine
                    y={res.goalFuture}
                    stroke="#34d399"
                    strokeDasharray="5 3"
                    label={{ value: "Goal", fill: "#34d399", fontSize: 10, position: "insideTopRight" }}
                  />
                  <Tooltip
                    cursor={{ stroke: "rgba(255,255,255,0.18)" }}
                    content={<PathTooltip />}
                  />
                  {show.map((_, i) => (
                    <Line
                      key={i}
                      type="monotone"
                      dataKey={`Path ${i + 1}`}
                      dot={false}
                      stroke={COLORS.paths[i % COLORS.paths.length]}
                      strokeWidth={1.5}
                      opacity={0.75}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
