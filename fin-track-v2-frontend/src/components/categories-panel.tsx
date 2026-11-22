"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMovement } from "@/components/app-shell";
import {
  CategoryFiltroIcon,
  type FiltroCategoria,
} from "@/components/category-filtro-icon";
import { CategoryCreateDialog } from "@/components/category-create-dialog";
import { CategoryGrid } from "@/components/category-grid";
import type { CategoryIconName } from "@/components/category-icon-data";
import type { CategoriaItem } from "@/components/category-types";
import { PlusIcon } from "@/components/icons/plus-icon";
import { LoadingScreen } from "@/components/loading-screen";
import { Section } from "@/components/section";
import { Tabs } from "@/components/tabs";
import type { TipoMovimiento } from "@/lib/finance";

const FILTROS: { id: FiltroCategoria; label: string }[] = [
  { id: "todo", label: "Todo" },
  { id: "egreso", label: "Egresos" },
  { id: "ingreso", label: "Ingresos" },
];

async function mensaje(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as { message?: unknown } | null;
  return typeof body?.message === "string" ? body.message : fallback;
}

export function CategoriesPanel() {
  const router = useRouter();
  const { revision, refresh } = useMovement();
  const [filtro, setFiltro] = useState<FiltroCategoria>("todo");
  const [categorias, setCategorias] = useState<Record<TipoMovimiento, CategoriaItem[]> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      const response = await fetch("/api/finanzas/categorias", {
        cache: "no-store",
      });

      if (!active) {
        return;
      }

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setError("No se pudieron cargar las categorías.");
        return;
      }

      setCategorias((await response.json()) as Record<TipoMovimiento, CategoriaItem[]>);
      setError(null);
    })();

    return () => {
      active = false;
    };
  }, [revision, router]);

  async function create(datos: {
    nombre: string;
    tipo: TipoMovimiento;
    icono: CategoryIconName;
  }) {
    setPending(true);
    setCreateError(null);

    const response = await fetch("/api/finanzas/categorias", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(datos),
    });

    if (response.status === 401) {
      window.location.assign("/login");
      return;
    }

    if (!response.ok) {
      setCreateError(await mensaje(response, "No se pudo crear la categoría."));
      setPending(false);
      return;
    }

    setPending(false);
    setCreating(false);
    refresh();
  }

  const tipoInicial: TipoMovimiento = filtro === "ingreso" ? "ingreso" : "egreso";

  return (
    <Section
      title="Categorías"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            label="Tipo de categoría"
            value={filtro}
            onChange={setFiltro}
            options={FILTROS.map((item) => ({
              ...item,
              icon: <CategoryFiltroIcon id={item.id} />,
            }))}
          />
          <button
            type="button"
            onClick={() => {
              setCreateError(null);
              setCreating(true);
            }}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-500 dark:bg-emerald-500 dark:text-black dark:hover:bg-emerald-400"
          >
            <PlusIcon />
            <span>Crear categoría</span>
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        {!categorias && !error ? <LoadingScreen label="Cargando categorías…" /> : null}
        {categorias ? (
          <CategoryGrid
            categorias={
              filtro === "todo"
                ? [...categorias.ingreso, ...categorias.egreso]
                : categorias[filtro]
            }
          />
        ) : null}
      </div>
      {creating ? (
        <CategoryCreateDialog
          tipoInicial={tipoInicial}
          pending={pending}
          error={createError}
          onClose={() => {
            if (!pending) {
              setCreating(false);
              setCreateError(null);
            }
          }}
          onCreate={(datos) => void create(datos)}
        />
      ) : null}
    </Section>
  );
}
