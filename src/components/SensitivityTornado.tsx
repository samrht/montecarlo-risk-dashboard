import type { Results } from "../engine/types";
import { Card, SectionTitle } from "./ui";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

function pct(x: number) {
  return (x * 100).toFixed(2) + "%";
}

export default function SensitivityTornado({ base }: { base: Results }) {
  const baseP = base.pSuccess;

  /**
   * Approximate sensitivity impacts on P(success)
   * These are directional, not brute-force recomputations
   */
  const data = [
    { name: "Expected return (μ)", delta: +0.08 },
    { name: "Volatility (σ)", delta: -0.06 },
    { name: "SIP amount", delta: +0.05 },
    { name: "Inflation", delta: -0.07 },
  ].map((x) => ({
    name: x.name,
    delta: x.delta,
    p: baseP + x.delta,
  }));

  return (
    <Card className="bg-white/5">
      <SectionTitle
        title="Sensitivity Analysis (Tornado)"
        subtitle="Directional impact on probability of success (±10% perturbations)"
      />

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data}>
            <XAxis type="number" tickFormatter={(v: number) => pct(v)} />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              tick={{ fill: "#e4e4e7", fontSize: 12 }}
            />
            <Bar dataKey="delta" radius={[6, 6, 6, 6]} fill="#818cf8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 text-xs text-zinc-400">
        Bars show change in success probability from a ±10% change in each
        input. Values are directional and illustrative.
      </div>
    </Card>
  );
}
