import type { Asset } from "../../engine/types";
import { Card, SectionTitle } from "../ui";
import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell } from "recharts";

const COLORS = [
  "#818cf8",
  "#22d3ee",
  "#34d399",
  "#fbbf24",
  "#fb7185",
  "#a78bfa",
];

export default function AllocDonut({ assets }: { assets: Asset[] }) {
  const total = assets.reduce((s, a) => s + Math.max(0, a.weight), 0) || 1;
  const data = assets.map((a) => ({
    name: a.name,
    value: Math.max(0, a.weight) / total,
  }));

  return (
    <Card className="bg-white/5">
      <SectionTitle title="Allocation" subtitle="Normalized weights" />
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                background: "rgba(238, 238, 240, 0.9)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
              }}
              formatter={(v: unknown) =>
                typeof v === "number" ? `${(v * 100).toFixed(1)}%` : String(v)
              }
            />
            <Pie
              data={data}
              dataKey="value"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
