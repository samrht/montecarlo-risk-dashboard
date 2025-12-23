import { Card } from "../ui";

export default function MetricTile({
  title,
  value,
  hint,
  tone = "neutral",
}: {
  title: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "good" | "warn";
}) {
  const color =
    tone === "good"
      ? "text-emerald-300"
      : tone === "warn"
      ? "text-amber-300"
      : "text-zinc-100";

  return (
    <Card className="bg-white/5">
      <div className="text-xs text-zinc-400">{title}</div>
      <div className={`mt-1 text-2xl font-bold ${color}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-zinc-400">{hint}</div>}
    </Card>
  );
}
