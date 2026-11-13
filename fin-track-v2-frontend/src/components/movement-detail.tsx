"use client";

import { useEffect } from "react";
import { Button } from "@/components/button";
import { formatMoneda, monedaDe } from "@/lib/display";
import { formatFecha, type Movimiento } from "@/lib/finance";

export function MovementDetail({
  movimiento,
  onClose,
  onEdit,
  onDelete,
}: {
  movimiento: Movimiento;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const ingreso = movimiento.tipo === "ingreso";

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-movimiento"
        className="w-full rounded-t-2xl border border-black/10 bg-background p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:max-w-md sm:rounded-2xl sm:p-6 dark:border-white/15"
      >
        <h2 id="detalle-movimiento" className="text-lg font-semibold">
          Movimiento
        </h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-neutral-500 dark:text-neutral-400">Categoría</dt>
            <dd className="font-medium text-right">{movimiento.categoria}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-neutral-500 dark:text-neutral-400">Tipo</dt>
            <dd className="font-medium text-right">{ingreso ? "Ingreso" : "Egreso"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-neutral-500 dark:text-neutral-400">Fecha</dt>
            <dd className="font-medium text-right">{formatFecha(movimiento.fecha)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-neutral-500 dark:text-neutral-400">Monto</dt>
            <dd
              className={`font-semibold tabular-nums text-right ${
                ingreso ? "text-emerald-600 dark:text-emerald-400" : ""
              }`}
            >
              {ingreso ? "+" : "−"}
              {formatMoneda(movimiento.monto, monedaDe(movimiento.moneda))}
            </dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="egreso" onClick={onClose}>
            Cerrar
          </Button>
          <Button variant="egreso" onClick={onDelete}>
            Eliminar
          </Button>
          <Button variant="primary" onClick={onEdit}>
            Editar
          </Button>
        </div>
      </div>
    </div>
  );
}
