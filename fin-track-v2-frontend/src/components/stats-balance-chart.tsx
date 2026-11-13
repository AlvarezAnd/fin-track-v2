import type { StatsPunto } from "@/components/stats-punto";

export function StatsBalanceChart({ puntos }: { puntos: StatsPunto[] }) {
  const width = 640;
  const height = 180;
  const pad = { left: 8, right: 8, top: 16, bottom: 28 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const values = puntos.map((punto) => punto.balance);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const span = max - min || 1;
  const y = (value: number) => pad.top + ((max - value) / span) * innerH;
  const stepX = innerW / Math.max(puntos.length - 1, 1);
  const line = puntos
    .map((punto, index) => `${index === 0 ? "M" : "L"} ${pad.left + stepX * index} ${y(punto.balance)}`)
    .join(" ");

  return (
    <figure className="rounded-2xl border border-black/10 p-4 dark:border-white/15 bg-neutral-200/60 dark:bg-neutral-900">
      <figcaption className="mb-3 text-sm font-medium">Balance acumulado</figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img">
        <title>Balance acumulado del período</title>
        <line
          x1={pad.left}
          x2={width - pad.right}
          y1={y(0)}
          y2={y(0)}
          className="stroke-black/10 dark:stroke-white/15"
        />
        <path d={line} fill="none" className="stroke-foreground" strokeWidth="2" />
      </svg>
    </figure>
  );
}
