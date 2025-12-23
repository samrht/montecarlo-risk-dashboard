import React from "react";
import { cx } from "./utils";

export function Card(props: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-white/10 bg-white/70 p-4 shadow-sm backdrop-blur",
        "dark:bg-zinc-900/50",
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
        props.className
      )}
    >
      {props.children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </div>
        {subtitle && (
          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            {subtitle}
          </div>
        )}
      </div>
      {right}
    </div>
  );
}

export function Label({ children }: React.PropsWithChildren) {
  return (
    <div className="mb-1 text-xs text-zinc-600 dark:text-zinc-400">
      {children}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cx(
        "w-full rounded-xl border border-zinc-200/80 bg-white px-3 py-2 text-sm outline-none text-zinc-900",
        "placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500/30",
        "dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-100 dark:placeholder:text-zinc-500",
        props.className
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cx(
        "w-full rounded-xl border border-zinc-200/80 bg-white px-3 py-2 text-sm outline-none text-zinc-900",
        "focus:ring-2 focus:ring-indigo-500/30",
        "dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-100",
        props.className
      )}
    >
      {props.children}
    </select>
  );
}

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "ghost" | "danger";
  }
) {
  const v = props.variant ?? "ghost";

  const base =
    "rounded-xl px-3 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50";

  const cls =
    v === "primary"
      ? "bg-indigo-600 text-white hover:bg-indigo-500"
      : v === "danger"
      ? "bg-rose-600 text-white hover:bg-rose-500"
      : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-white/10 dark:text-zinc-100 dark:hover:bg-white/15";

  return (
    <button {...props} className={cx(base, cls, props.className)}>
      {props.children}
    </button>
  );
}

export function Pill({ children }: React.PropsWithChildren) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs text-zinc-200">
      {children}
    </span>
  );
}
