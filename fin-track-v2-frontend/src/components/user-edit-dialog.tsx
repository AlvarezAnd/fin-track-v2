"use client";

import { useId, useState } from "react";
import { Button } from "@/components/button";
import { DialogOverlay } from "@/components/dialog-overlay";
import { SETTINGS_INPUT_CLASS } from "@/components/settings-styles";
import { useDialogDismiss } from "@/components/use-dialog-dismiss";
import type { RolItem, UsuarioItem } from "@/components/users-types";

export function UserEditDialog({
  usuario,
  roles,
  pending,
  error,
  onClose,
  onSave,
}: {
  usuario: UsuarioItem;
  roles: RolItem[];
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (roles: string[]) => void;
}) {
  const titleId = useId();
  const [selected, setSelected] = useState<string[]>(usuario.roles);
  useDialogDismiss(onClose, pending);

  function toggle(code: string) {
    setSelected((current) =>
      current.includes(code) ? current.filter((role) => role !== code) : [...current, code],
    );
  }

  return (
    <DialogOverlay onClose={pending ? () => undefined : onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full rounded-t-2xl border border-black/10 bg-background p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:max-w-md sm:rounded-2xl sm:p-6 dark:border-white/15"
      >
        <h2 id={titleId} className="text-lg font-semibold">
          Editar roles
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {usuario.username}
        </p>
        <fieldset className="mt-4 flex flex-col gap-3">
          <legend className="sr-only">Roles</legend>
          {roles.map((role) => (
            <label
              key={role.code}
              className={`${SETTINGS_INPUT_CLASS} flex h-auto cursor-pointer items-start gap-3 py-3`}
            >
              <input
                type="checkbox"
                checked={selected.includes(role.code)}
                disabled={pending}
                onChange={() => toggle(role.code)}
                className="mt-1 size-4 accent-foreground"
              />
              <span>
                <span className="block text-sm font-medium">{role.name}</span>
                <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                  {role.code}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
        {error ? (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="egreso" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            disabled={pending || selected.length === 0}
            onClick={() => onSave(selected)}
          >
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </div>
    </DialogOverlay>
  );
}
