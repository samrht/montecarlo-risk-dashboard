/**
 * OnboardingGuide.tsx
 *
 * A multi-step modal walkthrough for complete beginners.
 * Shown automatically on first visit (localStorage flag).
 * Re-openable from the Sidebar via the onOpen callback.
 */

import { useEffect, useState } from "react";

const STORAGE_KEY = "mc_guide_seen_v1";

type Step = {
  emoji: string;
  title: string;
  body: string[];
  tip?: string;
};

const STEPS: Step[] = [
  {
    emoji: "👋",
    title: "Welcome to Monte Carlo Lab",
    body: [
      "This tool helps you answer one big question: \"Will my savings be enough to reach my financial goal?\"",
      "Instead of giving you a single optimistic number, it runs thousands of possible futures — some where markets do well, some where they don't — and tells you the probability of success.",
      "Think of it like a weather forecast for your money. Not a guarantee, but an honest picture of the odds.",
    ],
    tip: "You don't need any finance or statistics background to use this. We'll explain everything as you go.",
  },
  {
    emoji: "🎯",
    title: "Step 1 — Set Your Goal",
    body: [
      "A goal is something you're saving towards — a house, retirement, your child's education, anything.",
      "Enter the amount in today's money (e.g. ₹25,00,000 for a ₹25L goal). The app automatically adjusts for inflation — prices rise over time, so ₹25L today will cost more in 10 years.",
      "Also set how many years you have to reach it. The longer the horizon, the better your odds — time is your biggest advantage.",
    ],
    tip: "Inflation is set to 6% by default (India's long-run average). You can change it in the Goal & Cashflows section.",
  },
  {
    emoji: "💰",
    title: "Step 2 — Set Your Contributions",
    body: [
      "Lump Sum: money you're investing right now, all at once.",
      "SIP (Systematic Investment Plan): a fixed amount you invest every month — like an auto-debit into a mutual fund. This is the most important lever you have.",
      "Income & caps: you can optionally tell the app your monthly income so it can cap your SIP at a realistic fraction of it. This prevents unrealistic projections.",
    ],
    tip: "SIP is the most powerful input. Even small increases in your monthly SIP can dramatically improve your success probability.",
  },
  {
    emoji: "📊",
    title: "Step 3 — Configure Your Portfolio",
    body: [
      "Add the assets you're investing in — for example, Equity (stocks), Debt (bonds/FDs), and Gold.",
      "For each asset, set the expected annual return (μ) and volatility (σ). Higher return usually means higher risk (higher σ).",
      "Weights decide how your money is split. 70% Equity, 20% Debt, 10% Gold is a classic aggressive allocation.",
      "Don't worry about getting these perfect — the defaults are reasonable for an Indian investor.",
    ],
    tip: "μ (mu) = average annual return. σ (sigma) = how wild the swings can be. A higher σ means more uncertainty.",
  },
  {
    emoji: "▶️",
    title: "Step 4 — Run the Simulation",
    body: [
      "Hit \"Run Simulation\" in the top bar. The app will simulate 30,000 different market futures in your browser — no data is sent anywhere.",
      "Each simulation is one possible life of your portfolio: sometimes markets crash, sometimes they boom, sometimes they're boring. The app captures all of this.",
      "It takes a few seconds. When it finishes, you'll automatically be taken to the Dashboard.",
    ],
    tip: "The simulation runs entirely on your device using Web Workers. Your financial data never leaves your browser.",
  },
  {
    emoji: "📈",
    title: "Reading Your Results",
    body: [
      "P(Success): the percentage of simulated futures where your portfolio reached the goal. Above 80% is generally considered a solid plan.",
      "VaR 5%: in the worst 5% of futures, your portfolio ends up at this value or lower. It's your downside safety check.",
      "CVaR: the average outcome in those worst 5% scenarios — even bleaker, but important to know.",
      "Median outcome: the middle result — half of simulations end above this, half below.",
    ],
    tip: "There's no such thing as a \"perfect\" plan. 70–80% success is reasonable — chasing 95%+ often means over-saving.",
  },
  {
    emoji: "🤖",
    title: "Actionable Recommendations",
    body: [
      "The \"Actionable Recommendations\" card tells you exactly what to change to hit 70%, 80%, or 90% success.",
      "If your success is too low, it tells you: increase your SIP by ₹X/month. Simple and specific.",
      "The \"Robustness\" card tells you how fragile your plan is. A Fragile plan works fine under your assumptions but falls apart if returns disappoint. A Robust plan survives even bad markets.",
    ],
    tip: "The Goal Finder card works in reverse — you tell it the success probability you want, and it tells you the maximum goal you can realistically target.",
  },
  {
    emoji: "🧪",
    title: "Stress Tests & Scenarios",
    body: [
      "Markets don't always behave as expected. Stress tests let you ask: \"what if returns are 2% lower and volatility is 50% higher than I assumed?\"",
      "Add stress tests in the Builder, then re-run the simulation. The Scenario Comparison card shows you how much your success probability drops under each stress scenario.",
      "The Sensitivity Tornado shows which inputs matter most. If your plan is very sensitive to expected returns, it's fragile. If it's robust to most inputs, you're in good shape.",
    ],
    tip: "A good plan should still show 50%+ success even under moderate stress. If it drops to 20% under mild stress, consider increasing your SIP.",
  },
  {
    emoji: "📄",
    title: "Export & Share",
    body: [
      "Click \"Export PDF Report\" on the Dashboard to generate a clean multi-page PDF of your full analysis.",
      "You can also Export your configuration as a JSON file and Import it later — useful if you want to save different scenarios.",
      "Share the PDF with a financial advisor to ground your conversation in actual probability — not just a single hopeful projection.",
    ],
    tip: "Remember: this tool is for education and planning. Always consult a registered financial advisor before making real investment decisions.",
  },
];

export default function OnboardingGuide({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);

  // Reset to step 0 each time the modal opens
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  if (!open) return null;

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
        {/* Progress bar */}
        <div className="h-1 rounded-t-2xl bg-white/10 overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-6">
          {/* Step counter */}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Step {step + 1} of {STEPS.length}
            </span>
            <button
              onClick={handleClose}
              className="text-zinc-500 hover:text-zinc-300 transition-colors text-lg leading-none"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="mb-5">
            <div className="mb-3 text-4xl">{current.emoji}</div>
            <h2 className="mb-4 text-xl font-bold text-white">{current.title}</h2>
            <div className="space-y-3">
              {current.body.map((para, i) => (
                <p key={i} className="text-sm leading-relaxed text-zinc-300">
                  {para}
                </p>
              ))}
            </div>

            {current.tip && (
              <div className="mt-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3">
                <div className="text-xs font-semibold text-indigo-300 mb-1">
                  💡 Tip
                </div>
                <p className="text-xs leading-relaxed text-indigo-200">
                  {current.tip}
                </p>
              </div>
            )}
          </div>

          {/* Step dots */}
          <div className="mb-5 flex justify-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? "w-6 bg-indigo-400"
                    : i < step
                    ? "w-1.5 bg-indigo-600"
                    : "w-1.5 bg-zinc-700"
                }`}
              />
            ))}
          </div>

          {/* Nav buttons */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={isFirst}
              className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 disabled:opacity-0 transition-all"
            >
              ← Back
            </button>

            {isLast ? (
              <button
                onClick={handleClose}
                className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-all"
              >
                Let's go →
              </button>
            ) : (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-all"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Hook to manage guide open state + first-visit auto-show */
export function useOnboardingGuide() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Show automatically on first visit
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  return {
    open,
    openGuide: () => setOpen(true),
    closeGuide: () => {
      localStorage.setItem(STORAGE_KEY, "1");
      setOpen(false);
    },
  };
}
