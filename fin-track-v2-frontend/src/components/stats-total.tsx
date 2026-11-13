export function StatsTotal({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "ingreso" | "egreso" | "balance";
}) {
  const color =
    tone === "ingreso"
      ? "text-emerald-700 dark:text-emerald-400"
      : tone === "egreso"
        ? "text-rose-700 dark:text-rose-400"
        : "";

  return (
    <section className="rounded-2xl border border-black/10 p-4 dark:border-white/15 bg-neutral-200/60 dark:bg-neutral-900">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`mt-2 text-xl font-semibold tabular-nums ${color}`}>{value}</p>
    </section>
  );
}
