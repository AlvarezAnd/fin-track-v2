"use client";

import { useId } from "react";
import { Button } from "@/components/button";
import { DialogOverlay } from "@/components/dialog-overlay";
import { useDialogDismiss } from "@/components/use-dialog-dismiss";
import { labelRoles, type UsuarioItem } from "@/components/users-types";

export function UserViewDialog({
  usuario,
  onClose,
}: {
  usuario: UsuarioItem;
  onClose: () => void;
}) {
  const titleId = useId();
  useDialogDismiss(onClose, true);

  return (
    <DialogOverlay onClose={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full rounded-t-2xl border border-black/10 bg-background p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:max-w-md sm:rounded-2xl sm:p-6 dark:border-white/15"
      >
        <h2 id={titleId} className="text-lg font-semibold">
          Usuario
        </h2>
        <dl className="mt-4 flex flex-col gap-3 text-sm">
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Nombre de usuario</dt>
            <dd className="mt-1 font-medium">{usuario.username}</dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Roles</dt>
            <dd className="mt-1 font-medium">{labelRoles(usuario.roles)}</dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Id</dt>
            <dd className="mt-1 font-medium">{usuario.id}</dd>
          </div>
        </dl>
        <div className="mt-5 flex justify-end">
          <Button variant="egreso" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </DialogOverlay>
  );
}
