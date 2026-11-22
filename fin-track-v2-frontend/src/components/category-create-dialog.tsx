"use client";

import { useId, useState } from "react";
import { Button } from "@/components/button";
import {
  suggestCategoryIcon,
  type CategoryIconName,
} from "@/components/category-icon-data";
import { CATEGORY_INPUT_CLASS } from "@/components/category-types";
import { DialogOverlay } from "@/components/dialog-overlay";
import { IconPicker } from "@/components/icon-picker";
import { useDialogDismiss } from "@/components/use-dialog-dismiss";
import type { TipoMovimiento } from "@/lib/finance";

export function CategoryCreateDialog({
  tipoInicial,
  pending,
  error,
  onClose,
  onCreate,
}: {
  tipoInicial: TipoMovimiento;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onCreate: (datos: {
    nombre: string;
    tipo: TipoMovimiento;
    icono: CategoryIconName;
  }) => void;
}) {
  const titleId = useId();
  const [tipo, setTipo] = useState<TipoMovimiento>(tipoInicial);
  const [nombre, setNombre] = useState("");
  const [icono, setIcono] = useState<CategoryIconName>("etiqueta");
  useDialogDismiss(onClose, pending);

  return (
    <DialogOverlay onClose={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full rounded-t-2xl border border-black/10 bg-background p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:max-w-md sm:rounded-2xl sm:p-6 dark:border-white/15"
      >
        <h2 id={titleId} className="text-lg font-semibold">
          Crear categoría
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Nombre, tipo e icono para usarla en los movimientos.
        </p>
        <form
          className="mt-5 flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onCreate({ nombre, tipo, icono });
          }}
        >
          <label className="flex flex-col gap-2 text-sm font-medium">
            Tipo
            <select
              name="tipo"
              value={tipo}
              disabled={pending}
              onChange={(event) => setTipo(event.target.value as TipoMovimiento)}
              className={CATEGORY_INPUT_CLASS}
            >
              <option value="egreso">Egreso</option>
              <option value="ingreso">Ingreso</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Nombre
            <input
              name="nombre"
              type="text"
              required
              autoFocus
              maxLength={80}
              value={nombre}
              disabled={pending}
              onChange={(event) => {
                const next = event.target.value;
                setNombre(next);
                setIcono(suggestCategoryIcon(next));
              }}
              className={CATEGORY_INPUT_CLASS}
            />
          </label>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Icono</p>
            <IconPicker value={icono} disabled={pending} onChange={setIcono} />
          </div>
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="egreso" onClick={onClose} disabled={pending}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={pending}>
              {pending ? "Creando…" : "Crear"}
            </Button>
          </div>
        </form>
      </div>
    </DialogOverlay>
  );
}
