import { cx } from "../utils";

export type NavKey = "builder" | "dashboard";

export default function Sidebar({
  active,
  onNav,
  hasResults,
  onOpenGuide,
}: {
  active: NavKey;
  onNav: (k: NavKey) => void;
  hasResults: boolean;
  onOpenGuide: () => void;
}) {
  const item = (
    k: NavKey,
    icon: string,
    title: string,
    subtitle: string,
    disabled = false
  ) => (
    <button
      onClick={() => !disabled && onNav(k)}
      disabled={disabled}
      className={cx(
        "w-full rounded-2xl border p-3 text-left transition-all",
        disabled
          ? "cursor-not-allowed border-white/5 bg-white/[0.02] opacity-40"
          : active === k
          ? "border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_12px_rgba(99,102,241,0.15)]"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <div>
          <div className="text-sm font-semibold text-zinc-100">{title}</div>
          <div className="text-xs text-zinc-400">{subtitle}</div>
        </div>
      </div>
      {active === k && !disabled && (
        <div className="mt-2 h-0.5 w-8 rounded-full bg-indigo-400/60" />
      )}
    </button>
  );

  return (
    <aside className="flex h-full flex-col gap-4 p-4">
      {/* Brand */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <div>
            <div className="text-base font-bold text-white">Monte Carlo Lab</div>
            <div className="text-xs text-zinc-400">Portfolio risk · goal feasibility</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="space-y-2">
        {item("builder", "⚙️", "Builder", "Goal, cashflows, assets")}
        {item(
          "dashboard",
          "📈",
          "Dashboard",
          hasResults ? "Results, risk, scenarios" : "Run a simulation first",
          !hasResults
        )}
      </nav>

      {/* How to use */}
      <button
        onClick={onOpenGuide}
        className="w-full rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-left transition-all hover:border-indigo-500/40 hover:bg-indigo-500/10"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">📖</span>
          <div>
            <div className="text-sm font-semibold text-indigo-300">How to use</div>
            <div className="text-xs text-zinc-500">Beginner's guide</div>
          </div>
        </div>
      </button>

      {/* Footer */}
      <div className="mt-auto text-xs text-zinc-600 px-1">
        All compute runs client-side.<br />No data leaves your browser.
      </div>
    </aside>
  );
}
