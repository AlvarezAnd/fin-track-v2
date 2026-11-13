"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMovement } from "@/components/app-shell";
import { Button } from "@/components/button";
import { FinanceBalance, type FinanceVista } from "@/components/finance-balance";
import { FinanceHistorial } from "@/components/finance-historial";
import { FinanceTotales } from "@/components/finance-totales";
import { ArrowDownLeft } from "@/components/icons/arrow-down-left";
import { ArrowUpRight } from "@/components/icons/arrow-up-right";
import { LoadingScreen } from "@/components/loading-screen";
import { Section } from "@/components/section";
import { Tabs } from "@/components/tabs";
import {
  mesActual,
  mesAnterior,
  type Movimiento,
  type PanelFinanciero,
} from "@/lib/finance";

const VISTAS: { id: FinanceVista; label: string }[] = [
  { id: "este", label: "Este Mes" },
  { id: "pasado", label: "Mes Pasado" },
  { id: "anio", label: "Año Actual" },
];

function redondear(value: number) {
  return Math.round(value * 100) / 100;
}

async function cargarVista(vista: FinanceVista): Promise<PanelFinanciero | "unauthorized"> {
  if (vista !== "anio") {
    const mes = vista === "pasado" ? mesAnterior() : mesActual();
    const response = await fetch(`/api/finanzas?mes=${mes}`, { cache: "no-store" });

    if (response.status === 401) {
      return "unauthorized";
    }

    if (!response.ok) {
      throw new Error("panel");
    }

    return (await response.json()) as PanelFinanciero;
  }

  const year = new Date().getFullYear();
  const response = await fetch(
    `/api/finanzas/movimientos?desde=${year}-01-01&hasta=${year}-12-31`,
    { cache: "no-store" },
  );

  if (response.status === 401) {
    return "unauthorized";
  }

  if (!response.ok) {
    throw new Error("panel");
  }

  const body = (await response.json()) as { movimientos: Movimiento[] };
  const ingresos = redondear(
    body.movimientos
      .filter((movimiento) => movimiento.tipo === "ingreso")
      .reduce((total, movimiento) => total + (movimiento.usd ?? 0), 0),
  );
  const egresos = redondear(
    body.movimientos
      .filter((movimiento) => movimiento.tipo === "egreso")
      .reduce((total, movimiento) => total + (movimiento.usd ?? 0), 0),
  );

  return {
    mes: String(year),
    balance: redondear(ingresos - egresos),
    ingresos,
    egresos,
    categorias: { ingreso: [], egreso: [] },
    movimientos: body.movimientos,
  };
}

export function FinancePanel() {
  const router = useRouter();
  const { openMovement, revision } = useMovement();
  const [vista, setVista] = useState<FinanceVista>("este");
  const [panel, setPanel] = useState<PanelFinanciero | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const next = await cargarVista(vista);

        if (!active) {
          return;
        }

        if (next === "unauthorized") {
          router.replace("/login");
          return;
        }

        setPanel(next);
        setError(null);
      } catch {
        if (!active) {
          return;
        }

        setError("No se pudo cargar el panel.");
      }
    })();

    return () => {
      active = false;
    };
  }, [vista, revision, router]);

  return (
    <Section
      title="Resumen"
      actions={
        <Tabs
          label="Período del resumen"
          value={vista}
          onChange={(next) => {
            setVista(next);
            setPanel(null);
            setError(null);
          }}
          options={VISTAS}
        />
      }
    >
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {!panel && !error ? <LoadingScreen label="Cargando resumen…" /> : null}
      {panel ? (
        <>
          <FinanceBalance panel={panel} vista={vista} />
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
            <Button variant="ingreso" className="sm:min-w-36" onClick={() => openMovement("ingreso")}>
              <ArrowDownLeft className="size-4" />
              Ingreso
            </Button>
            <Button variant="egreso" className="sm:min-w-36" onClick={() => openMovement("egreso")}>
              <ArrowUpRight className="size-4" />
              Egreso
            </Button>
          </div>
          <FinanceTotales panel={panel} />
          <FinanceHistorial panel={panel} vista={vista} />
        </>
      ) : null}
    </Section>
  );
}
