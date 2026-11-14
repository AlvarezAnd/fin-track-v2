"use client";

import { Button } from "@/components/button";
import { EditIcon } from "@/components/icons/edit-icon";
import { EyeIcon } from "@/components/icons/eye-icon";
import { TrashIcon } from "@/components/icons/trash-icon";

export function UsersAdminActions({
  canDelete,
  onView,
  onEdit,
  onDelete,
}: {
  canDelete: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center justify-end gap-1">
      <Button
        size="icon"
        variant="egreso"
        aria-label="Ver usuario"
        onClick={onView}
        className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
      >
        <EyeIcon />
      </Button>
      <Button
        size="icon"
        variant="egreso"
        aria-label="Editar usuario"
        onClick={onEdit}
        className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
      >
        <EditIcon />
      </Button>
      <Button
        size="icon"
        variant="egreso"
        aria-label="Eliminar usuario"
        onClick={onDelete}
        disabled={!canDelete}
        className="text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
      >
        <TrashIcon />
      </Button>
    </div>
  );
}
