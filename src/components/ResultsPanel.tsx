import type { Results } from "../engine/types";
import { Card } from "./ui";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

/* ---------- chart colors ---------- */
const COLORS = {
  terminal: "#818cf8",
  drawdown: "#fbbf24",
  paths: ["#22d3ee", "#a78bfa", "#34d399", "#f472b6", "#fb7185"],
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
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function formatPct(n: number) {
  return (n * 100).toFixed(2) + "%";
}

type TooltipPayloadItem = {
  name?: string;
  value?: number | string;
};

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

export default function ResultsPanel({
  label,
  res,
}: {
  label: string;
  res: Results;
}) {
  const termHist = hist(res.terminal, 40);
  const ddHist = hist(res.mdd, 40);

  const show = res.samplePaths.slice(0, 6);

  const pathData: Record<string, number>[] =
    show.length === 0
      ? []
      : show[0].map((_, t) => {
          const row: Record<string, number> = { t };
          show.forEach((p, i) => (row[`p${i}`] = p[t]));
          return row;
        });

  return (
    <div className="space-y-4">
      {/* ===== Scenario Header (USES label) ===== */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-zinc-200">
          {label} Scenario
        </div>
        <div className="text-xs text-zinc-400">
          sims {res.meta.nSims.toLocaleString()}
        </div>
      </div>

      {/* ===== KPI Row ===== */}
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 md:col-span-6 bg-white/5">
          <div className="text-xs text-zinc-400">Success Probability</div>
          <div className="mt-1 text-3xl font-bold text-emerald-300">
            {(res.pSuccess * 100).toFixed(2)}%
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            Failure {(res.pFail * 100).toFixed(2)}%
          </div>
        </Card>

        <Card className="col-span-12 md:col-span-6 bg-white/5">
          <div className="text-xs text-zinc-400">Downside Risk (5%)</div>
          <div className="mt-2 text-sm text-zinc-100">
            VaR {formatINR(res.var5)}
          </div>
          <div className="text-sm text-zinc-100">
            CVaR {formatINR(res.cvar5)}
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            Goal (future) {formatINR(res.goalFuture)}
          </div>
        </Card>
      </div>

      {/* ===== Charts ===== */}
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 lg:col-span-6 bg-white/5">
          <div className="mb-2 text-sm font-semibold">Terminal Wealth</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={termHist}>
                <XAxis
                  dataKey="x"
                  tickFormatter={(v: number) => `${Math.round(v / 1e5)}L`}
                />
                <YAxis />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.06)" }}
                  content={
                    <GlassTooltip
                      labelFormatter={(l) =>
                        typeof l === "number" ? formatINR(l) : String(l)
                      }
                      valueFormatter={(v) =>
                        Math.round(v).toLocaleString("en-IN")
                      }
                    />
                  }
                />
                <Bar dataKey="y" fill={COLORS.terminal} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-6 bg-white/5">
          <div className="mb-2 text-sm font-semibold">Max Drawdown</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ddHist}>
                <XAxis
                  dataKey="x"
                  tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                />
                <YAxis />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.06)" }}
                  content={
                    <GlassTooltip
                      labelFormatter={(l) =>
                        typeof l === "number" ? formatPct(l) : String(l)
                      }
                      valueFormatter={(v) =>
                        Math.round(v).toLocaleString("en-IN")
                      }
                    />
                  }
                />
                <Bar dataKey="y" fill={COLORS.drawdown} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="col-span-12 bg-white/5">
          <div className="mb-2 text-sm font-semibold">Sample Paths</div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pathData}>
                <XAxis dataKey="t" />
                <YAxis />
                <Tooltip
                  cursor={{ stroke: "rgba(255,255,255,0.18)" }}
                  content={
                    <GlassTooltip
                      labelFormatter={(l) => `Month ${String(l)}`}
                      valueFormatter={(v) => formatINR(v)}
                    />
                  }
                />
                {show.map((_, i) => (
                  <Line
                    key={i}
                    type="monotone"
                    dataKey={`p${i}`}
                    dot={false}
                    stroke={COLORS.paths[i % COLORS.paths.length]}
                    strokeWidth={2}
                    opacity={0.85}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
