"use client";

import { useDisplaySettings } from "@/components/display-settings";
import type { PanelFinanciero } from "@/lib/finance";

export function FinanceTotales({ panel }: { panel: PanelFinanciero }) {
  const { format, totales } = useDisplaySettings();
  const { ingresos, egresos } = totales(panel.movimientos);

  return (
    <div className="grid grid-cols-2 gap-3">
      <section className="rounded-2xl border border-black/10 p-4 dark:border-white/15 bg-neutral-200/60 dark:bg-neutral-900">
        <h2 className="text-sm text-zinc-500 dark:text-zinc-400">Ingresos</h2>
        <p className="mt-2 text-lg font-medium break-words tabular-nums text-emerald-700 dark:text-emerald-400">
          {format(ingresos)}
        </p>
      </section>
      <section className="rounded-2xl border border-black/10 p-4 dark:border-white/15 bg-neutral-200/60 dark:bg-neutral-900">
        <h2 className="text-sm text-zinc-500 dark:text-zinc-400">Egresos</h2>
        <p className="mt-2 text-lg font-medium break-words tabular-nums text-rose-700 dark:text-rose-400">
          {format(egresos)}
        </p>
      </section>
    </div>
  );
}
