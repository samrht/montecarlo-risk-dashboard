import { cx } from "../utils";

export type NavKey = "builder" | "dashboard";

export default function Sidebar({
  active,
  onNav,
}: {
  active: NavKey;
  onNav: (k: NavKey) => void;
}) {
  const item = (k: NavKey, title: string, subtitle: string) => (
    <button
      onClick={() => onNav(k)}
      className={cx(
        "w-full rounded-2xl border p-3 text-left transition",
        active === k
          ? "border-indigo-500/40 bg-indigo-500/10"
          : "border-white/10 bg-white/5 hover:bg-white/10"
      )}
    >
      <div className="text-sm font-semibold text-zinc-100">{title}</div>
      <div className="text-xs text-zinc-400">{subtitle}</div>
    </button>
  );

  return (
    <aside className="flex h-full flex-col gap-4 p-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-lg font-bold text-white">Monte Carlo Lab</div>
        <div className="mt-1 text-xs text-zinc-400">
          Portfolio risk + goal feasibility
        </div>
      </div>

      <div className="space-y-2">
        {item("builder", "Builder", "Set goal, cashflows, assets")}
        {item("dashboard", "Dashboard", "Results, risk metrics, scenarios")}
      </div>
    </aside>
  );
}
