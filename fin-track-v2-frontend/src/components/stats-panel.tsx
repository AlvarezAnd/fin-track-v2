"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMovement } from "@/components/app-shell";
import { useDisplaySettings } from "@/components/display-settings";
import { LoadingScreen } from "@/components/loading-screen";
import { Section } from "@/components/section";
import { StatsBalanceChart } from "@/components/stats-balance-chart";
import { StatsChart } from "@/components/stats-chart";
import { puntosDe, redondearStats } from "@/components/stats-punto";
import { StatsTotal } from "@/components/stats-total";
import { Tabs } from "@/components/tabs";
import { montoEnMoneda } from "@/lib/display";
import {
  formatFecha,
  rangoPeriodo,
  type Movimiento,
  type Periodo,
} from "@/lib/finance";

const PERIODOS: { id: Periodo; label: string }[] = [
  { id: "dia", label: "Día" },
  { id: "mes", label: "Mes" },
  { id: "3m", label: "3 meses" },
  { id: "6m", label: "6 meses" },
  { id: "anio", label: "Año" },
];

export function StatsPanel() {
  const router = useRouter();
  const { format, preferencias, cambios } = useDisplaySettings();
  const { revision } = useMovement();
  const [movimientos, setMovimientos] = useState<Movimiento[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>("mes");

  useEffect(() => {
    let active = true;
    const { desde, hasta } = rangoPeriodo("anio");

    void (async () => {
      const response = await fetch(
        `/api/finanzas/movimientos?desde=${desde}&hasta=${hasta}`,
        { cache: "no-store" },
      );

      if (!active) {
        return;
      }

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setError("No se pudieron cargar las estadísticas.");
        return;
      }

      const body = (await response.json()) as { movimientos: Movimiento[] };
      setMovimientos(body.movimientos);
      setError(null);
    })();

    return () => {
      active = false;
    };
  }, [revision, router]);

  const puntos = useMemo(
    () =>
      movimientos
        ? puntosDe(movimientos, periodo, (movimiento) =>
            montoEnMoneda(movimiento, preferencias.moneda, cambios),
          )
        : [],
    [movimientos, periodo, preferencias.moneda, cambios],
  );
  const ingresos = redondearStats(puntos.reduce((total, punto) => total + punto.ingresos, 0));
  const egresos = redondearStats(puntos.reduce((total, punto) => total + punto.egresos, 0));
  const balance = redondearStats(ingresos - egresos);
  const rango = rangoPeriodo(periodo);

  return (
    <Section
      title="Estadísticas"
      actions={
        <Tabs
          label="Período"
          value={periodo}
          onChange={setPeriodo}
          options={PERIODOS}
        />
      }
    >
      <p className="text-sm capitalize text-zinc-500 dark:text-zinc-400">
        {periodo === "dia" ? formatFecha(rango.desde) : `${formatFecha(rango.desde)} – ${formatFecha(rango.hasta)}`}
      </p>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {!movimientos && !error ? <LoadingScreen label="Cargando estadísticas…" /> : null}
      {movimientos ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatsTotal label="Ingresos" value={format(ingresos)} tone="ingreso" />
            <StatsTotal label="Egresos" value={format(egresos)} tone="egreso" />
            <StatsTotal label="Balance" value={format(balance)} tone="balance" />
          </div>
          <StatsChart puntos={puntos} />
          {puntos.length > 1 ? <StatsBalanceChart puntos={puntos} /> : null}
        </>
      ) : null}
    </Section>
  );
}
