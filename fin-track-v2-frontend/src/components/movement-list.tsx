"use client";

import { useState } from "react";
import { useMovement } from "@/components/app-shell";
import { Button } from "@/components/button";
import { CategoryIcon } from "@/components/category-icon";
import { EditIcon } from "@/components/icons/edit-icon";
import { TrashIcon } from "@/components/icons/trash-icon";
import { MovementActionsMenu } from "@/components/movement-actions-menu";
import { MovementDetail } from "@/components/movement-detail";
import { formatMoneda, monedaDe } from "@/lib/display";
import { formatFecha, type Movimiento } from "@/lib/finance";

export function MovementList({
  movimientos,
  empty,
}: {
  movimientos: Movimiento[];
  empty: string;
}) {
  const { openMovement, removeMovement } = useMovement();
  const [target, setTarget] = useState<Movimiento | null>(null);
  const [detail, setDetail] = useState<Movimiento | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    if (!target) {
      return;
    }

    setPending(true);
    const message = await removeMovement(target.id);
    setPending(false);

    if (message) {
      setError(message);
      return;
    }

    setTarget(null);
    setDetail(null);
    setError(null);
  }

  if (movimientos.length === 0) {
    return <p className="mt-5 px-2 text-sm text-neutral-500">{empty}</p>;
  }

  return (
    <>
      {error ? (
        <p className="mt-4 px-2 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-5 divide-y divide-black/10 dark:divide-white/10">
        {movimientos.map((movimiento) => {
          const ingreso = movimiento.tipo === "ingreso";

          return (
            <div
              key={movimiento.id}
              className="group flex items-center justify-between gap-2 rounded-lg px-2 py-3.5 transition-colors hover:bg-white/70 dark:hover:bg-white/[.06]"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3.5 pr-2">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                    ingreso
                      ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "border-neutral-200 bg-neutral-100 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                  }`}
                >
                  <CategoryIcon name={movimiento.icono} className="size-4" />
                </span>
                <div className="min-w-0 sm:hidden">
                  <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                    {ingreso ? "Ingreso" : "Egreso"}
                  </p>
                </div>
                <div className="hidden min-w-0 sm:block">
                  <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                    {movimiento.categoria}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                    <span>{ingreso ? "Ingreso" : "Egreso"}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatFecha(movimiento.fecha)}</span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <span
                  className={`text-right text-sm font-semibold tracking-tight tabular-nums sm:text-base ${
                    ingreso
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-neutral-900 dark:text-white"
                  }`}
                >
                  {ingreso ? "+" : "−"}
                  {formatMoneda(movimiento.monto, monedaDe(movimiento.moneda))}
                </span>
                <div className="hidden items-center gap-1 opacity-80 transition-opacity sm:flex sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                  <button
                    type="button"
                    aria-label="Editar movimiento"
                    onClick={() => openMovement(movimiento)}
                    className="cursor-pointer rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-200/60 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    aria-label="Eliminar movimiento"
                    onClick={() => {
                      setError(null);
                      setTarget(movimiento);
                    }}
                    className="cursor-pointer rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                  >
                    <TrashIcon />
                  </button>
                </div>
                <div className="sm:hidden">
                  <MovementActionsMenu
                    onView={() => setDetail(movimiento)}
                    onEdit={() => openMovement(movimiento)}
                    onDelete={() => {
                      setError(null);
                      setTarget(movimiento);
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {detail ? (
        <MovementDetail
          movimiento={detail}
          onClose={() => setDetail(null)}
          onEdit={() => {
            setDetail(null);
            openMovement(detail);
          }}
          onDelete={() => {
            setDetail(null);
            setError(null);
            setTarget(detail);
          }}
        />
      ) : null}
      {target ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !pending) {
              setTarget(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="eliminar-movimiento"
            className="w-full rounded-t-2xl border border-black/10 bg-background p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:max-w-md sm:rounded-2xl sm:p-6 dark:border-white/15"
          >
            <h2 id="eliminar-movimiento" className="text-lg font-semibold">
              ¿Eliminar este movimiento?
            </h2>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              {target.categoria} · {target.tipo === "ingreso" ? "+" : "−"}
              {formatMoneda(target.monto, monedaDe(target.moneda))}
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="egreso" onClick={() => setTarget(null)} disabled={pending}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={() => void confirmDelete()} disabled={pending}>
                {pending ? "Eliminando…" : "Eliminar"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
