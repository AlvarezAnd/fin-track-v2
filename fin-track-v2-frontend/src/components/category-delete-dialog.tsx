"use client";

import { useId } from "react";
import { Button } from "@/components/button";
import type { CategoriaItem } from "@/components/category-types";
import { DialogOverlay } from "@/components/dialog-overlay";
import { useDialogDismiss } from "@/components/use-dialog-dismiss";

export function CategoryDeleteDialog({
  categoria,
  pending,
  error,
  onClose,
  onConfirm,
}: {
  categoria: CategoriaItem;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  useDialogDismiss(onClose, pending);

  return (
    <DialogOverlay onClose={pending ? () => undefined : onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full rounded-t-2xl border border-black/10 bg-background p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:max-w-md sm:rounded-2xl sm:p-6 dark:border-white/15"
      >
        <h2 id={titleId} className="text-lg font-semibold">
          ¿Eliminar esta categoría?
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {categoria.tipo === "ingreso" ? "Ingreso" : "Egreso"} · {categoria.nombre}
        </p>
        {error ? (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="egreso" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={onConfirm} disabled={pending}>
            {pending ? "Eliminando…" : "Eliminar"}
          </Button>
        </div>
      </div>
    </DialogOverlay>
  );
}
