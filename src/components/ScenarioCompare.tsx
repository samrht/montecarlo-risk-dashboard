import type { Results } from "../engine/types";
import { Card, SectionTitle } from "./ui";

function pct(x: number) {
  return (x * 100).toFixed(2) + "%";
}
function inr(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export default function ScenarioCompare({
  base,
  stress,
}: {
  base: Results;
  stress: { label: string; res: Results }[];
}) {
  const rows = stress.map((s) => {
    const pBase = base.pSuccess;
    const pS = s.res.pSuccess;

    // For VaR/CVaR: higher is better for wealth distributions (less downside)
    const varDelta = s.res.var5 - base.var5;
    const cvarDelta = s.res.cvar5 - base.cvar5;

    return {
      label: s.label,
      pSuccess: s.res.pSuccess,
      pDelta: pS - pBase,
      var5: s.res.var5,
      varDelta,
      cvar5: s.res.cvar5,
      cvarDelta,
    };
  });

  const deltaClass = (d: number) =>
    d >= 0 ? "text-emerald-300" : "text-rose-300";

  return (
    <Card className="bg-white/5">
      <SectionTitle
        title="Scenario Comparison"
        subtitle="Base vs stress deltas (success probability + downside risk)"
      />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-zinc-300">
            <tr className="border-b border-white/10">
              <th className="py-2 pr-3 font-semibold">Scenario</th>
              <th className="py-2 pr-3 font-semibold">P(success)</th>
              <th className="py-2 pr-3 font-semibold">Δ P</th>
              <th className="py-2 pr-3 font-semibold">VaR 5%</th>
              <th className="py-2 pr-3 font-semibold">Δ VaR</th>
              <th className="py-2 pr-3 font-semibold">CVaR 5%</th>
              <th className="py-2 pr-3 font-semibold">Δ CVaR</th>
            </tr>
          </thead>

          <tbody className="text-zinc-100">
            <tr className="border-b border-white/10">
              <td className="py-2 pr-3 font-medium text-zinc-200">Base</td>
              <td className="py-2 pr-3">{pct(base.pSuccess)}</td>
              <td className="py-2 pr-3 text-zinc-400">—</td>
              <td className="py-2 pr-3">{inr(base.var5)}</td>
              <td className="py-2 pr-3 text-zinc-400">—</td>
              <td className="py-2 pr-3">{inr(base.cvar5)}</td>
              <td className="py-2 pr-3 text-zinc-400">—</td>
            </tr>

            {rows.map((r) => (
              <tr
                key={r.label}
                className="border-b border-white/10 last:border-b-0"
              >
                <td className="py-2 pr-3 font-medium text-zinc-200">
                  {r.label}
                </td>
                <td className="py-2 pr-3">{pct(r.pSuccess)}</td>
                <td
                  className={`py-2 pr-3 font-semibold ${deltaClass(r.pDelta)}`}
                >
                  {r.pDelta >= 0 ? "+" : ""}
                  {pct(r.pDelta)}
                </td>
                <td className="py-2 pr-3">{inr(r.var5)}</td>
                <td
                  className={`py-2 pr-3 font-semibold ${deltaClass(
                    r.varDelta
                  )}`}
                >
                  {r.varDelta >= 0 ? "+" : ""}
                  {inr(r.varDelta)}
                </td>
                <td className="py-2 pr-3">{inr(r.cvar5)}</td>
                <td
                  className={`py-2 pr-3 font-semibold ${deltaClass(
                    r.cvarDelta
                  )}`}
                >
                  {r.cvarDelta >= 0 ? "+" : ""}
                  {inr(r.cvarDelta)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {stress.length === 0 && (
        <div className="mt-2 text-xs text-zinc-400">
          Add stress tests in Builder to see comparisons here.
        </div>
      )}
    </Card>
  );
}
