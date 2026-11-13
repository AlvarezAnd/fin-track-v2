"use client";

import { useState } from "react";
import { useMovement } from "@/components/app-shell";
import { Button } from "@/components/button";
import { CategoryDeleteDialog } from "@/components/category-delete-dialog";
import { CategoryEditDialog } from "@/components/category-edit-dialog";
import { CategoryIconBadge } from "@/components/category-icon-badge";
import type { CategoryIconName } from "@/components/category-icon-data";
import type { CategoriaItem } from "@/components/category-types";
import { EditIcon } from "@/components/icons/edit-icon";
import { TrashIcon } from "@/components/icons/trash-icon";

async function mensaje(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as { message?: unknown } | null;
  return typeof body?.message === "string" ? body.message : fallback;
}

export function CategoryGrid({ categorias }: { categorias: CategoriaItem[] }) {
  const { refresh } = useMovement();
  const [editing, setEditing] = useState<CategoriaItem | null>(null);
  const [deleting, setDeleting] = useState<CategoriaItem | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ordenadas = [...categorias].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es"),
  );

  async function save(categoria: CategoriaItem, nombre: string, icono: CategoryIconName) {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/finanzas/categorias/${categoria.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nombre, icono }),
    });

    if (response.status === 401) {
      window.location.assign("/login");
      return;
    }

    if (!response.ok) {
      setError(await mensaje(response, "No se pudo guardar la categoría."));
      setPending(false);
      return;
    }

    setPending(false);
    setEditing(null);
    refresh();
  }

  async function remove(categoria: CategoriaItem) {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/finanzas/categorias/${categoria.id}`, {
      method: "DELETE",
    });

    if (response.status === 401) {
      window.location.assign("/login");
      return;
    }

    if (!response.ok) {
      setError(await mensaje(response, "No se pudo eliminar la categoría."));
      setPending(false);
      return;
    }

    setPending(false);
    setDeleting(null);
    refresh();
  }

  if (ordenadas.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Todavía no hay categorías.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && !editing && !deleting ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ordenadas.map((categoria) => {
          const ingreso = categoria.tipo === "ingreso";

          return (
            <li
              key={categoria.id}
              className={`rounded-2xl border p-4 bg-neutral-200/60 dark:bg-neutral-900 ${ingreso ? "border-emerald-600 dark:border-emerald-500" : "border-black/10 dark:border-white/15"}`}
            >
              <p
                className={`text-xs font-medium ${ingreso ? "text-emerald-800 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"}`}
              >
                {ingreso ? "Ingreso" : "Egreso"}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <CategoryIconBadge name={categoria.icono} ingreso={ingreso} label={categoria.nombre} />
                <span className="min-w-0 flex-1 truncate font-medium">{categoria.nombre}</span>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="egreso"
                    aria-label={`Editar ${categoria.nombre}`}
                    aria-haspopup="dialog"
                    disabled={pending}
                    onClick={() => {
                      setError(null);
                      setDeleting(null);
                      setEditing(categoria);
                    }}
                  >
                    <EditIcon />
                  </Button>
                  <Button
                    size="icon"
                    variant="egreso"
                    aria-label={`Eliminar ${categoria.nombre}`}
                    aria-haspopup="dialog"
                    disabled={pending}
                    onClick={() => {
                      setError(null);
                      setEditing(null);
                      setDeleting(categoria);
                    }}
                  >
                    <span className="text-rose-700 dark:text-rose-400">
                      <TrashIcon />
                    </span>
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {editing ? (
        <CategoryEditDialog
          categoria={editing}
          pending={pending}
          error={error}
          onClose={() => {
            if (!pending) {
              setEditing(null);
              setError(null);
            }
          }}
          onSave={(nombre, icono) => void save(editing, nombre, icono)}
        />
      ) : null}
      {deleting ? (
        <CategoryDeleteDialog
          categoria={deleting}
          pending={pending}
          error={error}
          onClose={() => {
            if (!pending) {
              setDeleting(null);
              setError(null);
            }
          }}
          onConfirm={() => void remove(deleting)}
        />
      ) : null}
    </div>
  );
}
