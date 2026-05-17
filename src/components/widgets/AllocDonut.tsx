import type { Asset } from "../../engine/types";
import { Card, SectionTitle } from "../ui";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = [
  "#818cf8", "#22d3ee", "#34d399",
  "#fbbf24", "#fb7185", "#a78bfa",
];

export default function AllocDonut({ assets }: { assets: Asset[] }) {
  const total = assets.reduce((s, a) => s + Math.max(0, a.weight), 0) || 1;
  const data = assets.map((a) => ({
    name: a.name,
    value: Math.max(0, a.weight) / total,
    raw: a.weight,
  }));

  return (
    <Card className="bg-white/5">
      <SectionTitle title="Allocation" subtitle="Normalized weights" />

      <div className="flex items-center gap-4">
        <div className="h-44 w-44 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius={42}
                outerRadius={68}
                paddingAngle={2}
                startAngle={90}
                endAngle={-270}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2 min-w-0">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-2 min-w-0">
              <span
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="truncate text-xs text-zinc-300">{d.name}</span>
              <span className="ml-auto text-xs font-medium text-zinc-100 flex-shrink-0">
                {(d.value * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
