"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/button";
import type { FinanceVista } from "@/components/finance-balance";
import { MovementList } from "@/components/movement-list";
import { beginRouteLoading } from "@/components/navigation-loading";
import type { PanelFinanciero } from "@/lib/finance";

function vacioPeriodo(vista: FinanceVista) {
  if (vista === "anio") {
    return "Todavía no hay movimientos este año.";
  }

  if (vista === "pasado") {
    return "Todavía no hay movimientos el mes pasado.";
  }

  return "Todavía no hay movimientos este mes.";
}

export function FinanceHistorial({
  panel,
  vista,
}: {
  panel: PanelFinanciero;
  vista: FinanceVista;
}) {
  const router = useRouter();
  const visibles = panel.movimientos.slice(0, 5);
  const total = panel.movimientos.length;

  return (
    <section className="rounded-xl border border-black/10 bg-neutral-200/60 p-5 transition-colors sm:p-6 dark:border-white/15 dark:bg-neutral-900">
      <div className="border-b border-black/10 pb-5 dark:border-white/10">
        <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
          Últimos movimientos
        </h2>
        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
          {total === 1 ? "1 registro encontrado" : `${total} registros encontrados`}
        </p>
      </div>
      <MovementList movimientos={visibles} empty={vacioPeriodo(vista)} />
      {total > 0 ? (
        <div className="mt-5 flex justify-center border-t border-black/10 pt-4 dark:border-white/10">
          <Button
            variant="egreso"
            onClick={() => {
              beginRouteLoading();
              router.push("/dashboard/movimientos");
            }}
          >
            Ver más
          </Button>
        </div>
      ) : null}
    </section>
  );
}
