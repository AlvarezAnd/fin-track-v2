"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMovement } from "@/components/app-shell";
import {
  CategoryFiltroIcon,
  type FiltroCategoria,
} from "@/components/category-filtro-icon";
import { CategoryGrid } from "@/components/category-grid";
import type { CategoriaItem } from "@/components/category-types";
import { LoadingScreen } from "@/components/loading-screen";
import { Section } from "@/components/section";
import { Tabs } from "@/components/tabs";
import type { TipoMovimiento } from "@/lib/finance";

const FILTROS: { id: FiltroCategoria; label: string }[] = [
  { id: "todo", label: "Todo" },
  { id: "egreso", label: "Egresos" },
  { id: "ingreso", label: "Ingresos" },
];

export function CategoriesPanel() {
  const router = useRouter();
  const { revision } = useMovement();
  const [filtro, setFiltro] = useState<FiltroCategoria>("todo");
  const [categorias, setCategorias] = useState<Record<TipoMovimiento, CategoriaItem[]> | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <Section
      title="Categorías"
      actions={
        <Tabs
          label="Tipo de categoría"
          value={filtro}
          onChange={setFiltro}
          options={FILTROS.map((item) => ({
            ...item,
            icon: <CategoryFiltroIcon id={item.id} />,
          }))}
        />
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
    </Section>
  );
}
