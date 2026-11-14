"use client";

import { UsersAdminActions } from "@/components/users-admin-actions";
import { labelRoles, type UsuarioItem } from "@/components/users-types";

export function UsersAdminRow({
  usuario,
  canDelete,
  onView,
  onEdit,
  onDelete,
}: {
  usuario: UsuarioItem;
  canDelete: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <tr className="border-t border-black/10 dark:border-white/10">
      <td className="px-3 py-3 align-middle text-sm text-neutral-900 dark:text-white">
        <span className="font-medium">{usuario.username}</span>
        <span className="mt-0.5 block text-xs text-neutral-500 sm:hidden dark:text-neutral-400">
          {labelRoles(usuario.roles)}
        </span>
      </td>
      <td className="hidden px-3 py-3 align-middle text-sm text-neutral-600 sm:table-cell dark:text-neutral-300">
        {labelRoles(usuario.roles)}
      </td>
      <td className="px-2 py-2 align-middle sm:px-3">
        <UsersAdminActions
          canDelete={canDelete}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
}
