"use client";

import { UsersAdminRow } from "@/components/users-admin-row";
import type { UsuarioItem } from "@/components/users-types";

export function UsersAdminTable({
  usuarios,
  sessionUsername,
  onView,
  onEdit,
  onDelete,
}: {
  usuarios: UsuarioItem[];
  sessionUsername: string;
  onView: (usuario: UsuarioItem) => void;
  onEdit: (usuario: UsuarioItem) => void;
  onDelete: (usuario: UsuarioItem) => void;
}) {
  if (usuarios.length === 0) {
    return (
      <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
        No hay usuarios que coincidan con la búsqueda.
      </p>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-black/10 dark:border-white/15">
      <table className="min-w-full border-collapse text-left">
        <thead className="bg-black/[.03] text-xs tracking-wide text-neutral-500 uppercase dark:bg-white/[.04] dark:text-neutral-400">
          <tr>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Usuario
            </th>
            <th scope="col" className="hidden px-3 py-2.5 font-medium sm:table-cell">
              Roles
            </th>
            <th scope="col" className="px-3 py-2.5 text-right font-medium sm:w-40">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => (
            <UsersAdminRow
              key={usuario.id}
              usuario={usuario}
              canDelete={usuario.username !== sessionUsername}
              onView={() => onView(usuario)}
              onEdit={() => onEdit(usuario)}
              onDelete={() => onDelete(usuario)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
