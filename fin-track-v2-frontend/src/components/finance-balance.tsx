"use client";

import { useEffect, useState } from "react";
import { useDisplaySettings } from "@/components/display-settings";
import { formatMes, mesActual, mesAnterior, type PanelFinanciero } from "@/lib/finance";

export type FinanceVista = "este" | "pasado" | "anio";

function etiquetaPeriodo(vista: FinanceVista, ahora: Date) {
  if (vista === "anio") {
    return String(ahora.getFullYear());
  }

  return formatMes(vista === "pasado" ? mesAnterior(ahora) : mesActual(ahora));
}

export function FinanceBalance({
  panel,
  vista,
}: {
  panel: PanelFinanciero;
  vista: FinanceVista;
}) {
  const { format, totales } = useDisplaySettings();
  const [ahora, setAhora] = useState<Date | null>(null);

  useEffect(() => {
    setAhora(new Date());
  }, []);

  return (
    <section
      aria-label={vista === "anio" ? "Balance del año" : "Balance del mes"}
      className="rounded-2xl border border-black/10 p-4 sm:p-6 dark:border-white/15 bg-neutral-200/60 dark:bg-neutral-900"
    >
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {vista === "anio" ? "Balance del año" : "Balance del mes"}
      </p>
      <p className="mt-1 text-sm capitalize text-zinc-500 dark:text-zinc-400">
        {ahora ? etiquetaPeriodo(vista, ahora) : "\u00a0"}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight break-words tabular-nums sm:text-4xl">
        {format(totales(panel.movimientos).balance)}
      </p>
    </section>
  );
}
