"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMovement } from "@/components/app-shell";
import { ExportMenu, type FormatoExportacion } from "@/components/export-menu";
import { ImportDialog } from "@/components/import-dialog";
import { PlusIcon } from "@/components/icons/plus-icon";
import { SearchIcon } from "@/components/icons/search-icon";
import { UploadIcon } from "@/components/icons/upload-icon";
import { LoadingScreen } from "@/components/loading-screen";
import { MovementList } from "@/components/movement-list";
import { Section } from "@/components/section";
import { Tabs } from "@/components/tabs";
import { formatMoneda, monedaDe } from "@/lib/display";
import { fechaLocal, movimientoCoincide, type Movimiento } from "@/lib/finance";

type Filtro = "todo" | "ingreso" | "egreso";

export function MovementsPanel() {
  const router = useRouter();
  const { revision, openMovement } = useMovement();
  const [movimientos, setMovimientos] = useState<Movimiento[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [query, setQuery] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todo");
  const [categoria, setCategoria] = useState("todas");
  const categorias = useMemo(() => {
    const seen = new Set<string>();

    return (movimientos ?? []).filter((movimiento) => {
      const key = `${movimiento.tipo}:${movimiento.categoria}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }, [movimientos]);
  const visibles = (movimientos ?? []).filter(
    (movimiento) =>
      (filtro === "todo" || movimiento.tipo === filtro) &&
      (categoria === "todas" ||
        `${movimiento.tipo}:${movimiento.categoria}` === categoria) &&
      movimientoCoincide(movimiento, query, formatMoneda(movimiento.monto, monedaDe(movimiento.moneda))),
  );

  useEffect(() => {
    let active = true;
    const hasta = fechaLocal();

    void (async () => {
      const response = await fetch(
        `/api/finanzas/movimientos?desde=1970-01-01&hasta=${hasta}`,
        { cache: "no-store" },
      );

      if (!active) {
        return;
      }

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setError("No se pudo cargar el historial.");
        return;
      }

      const body = (await response.json()) as { movimientos: Movimiento[] };
      setMovimientos(body.movimientos);
      setError(null);
    })();

    return () => {
      active = false;
    };
  }, [revision, router]);

  async function exportar(formato: FormatoExportacion) {
    setExportando(true);
    setExportError(null);

    try {
      const response = await fetch(`/api/finanzas/exportar/${formato}`);

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setExportError("No se pudieron exportar los movimientos.");
        return;
      }

      const blob = await response.blob();
      const nombre =
        response.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1] ??
        `movimientos.${formato === "excel" ? "xlsx" : formato}`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = nombre;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("No se pudieron exportar los movimientos.");
    } finally {
      setExportando(false);
    }
  }

  return (
    <Section
      title="Movimientos"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setImportando(true)}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
          >
            <UploadIcon />
            <span>Importar</span>
          </button>
          <ExportMenu
            disabled={!movimientos || exportando}
            onExport={(formato) => void exportar(formato)}
          />
          <button
            type="button"
            onClick={() => openMovement()}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-500 dark:bg-emerald-500 dark:text-black dark:hover:bg-emerald-400"
          >
            <PlusIcon />
            <span>Nuevo</span>
          </button>
        </div>
      }
    >
      {importando ? <ImportDialog onClose={() => setImportando(false)} /> : null}
      {exportError ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {exportError}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {!movimientos && !error ? <LoadingScreen label="Cargando movimientos…" /> : null}
      {movimientos ? (
      <section className="rounded-xl border border-black/10 bg-neutral-200/60 p-5 transition-colors sm:p-6 dark:border-white/15 dark:bg-neutral-900">
        <div className="border-b border-black/10 pb-5 dark:border-white/10">
          <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
            Historial de movimientos
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            {visibles.length === 1
              ? "1 registro encontrado"
              : `${visibles.length} registros encontrados`}
          </p>
        </div>
        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <SearchIcon />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por categoría o monto..."
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50/70 py-2 pr-3 pl-9 text-xs text-neutral-900 placeholder:text-neutral-400 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
            />
          </div>
          <div className="shrink-0">
            <Tabs
              label="Tipo de movimiento"
              value={filtro}
              onChange={(value) => {
                setFiltro(value);
                const otro = value === "ingreso" ? "egreso" : "ingreso";

                if (value !== "todo" && categoria.startsWith(`${otro}:`)) {
                  setCategoria("todas");
                }
              }}
              options={[
                { id: "todo", label: "Todos" },
                { id: "ingreso", label: "Ingresos" },
                { id: "egreso", label: "Egresos" },
              ]}
            />
          </div>
          <div className="relative shrink-0">
            <select
              value={categoria}
              onChange={(event) => setCategoria(event.target.value)}
              className="w-full cursor-pointer rounded-lg border border-neutral-200 bg-neutral-50/70 px-3 py-2 text-xs text-neutral-900 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden sm:w-auto dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
            >
              <option value="todas">Todas las categorías</option>
              {categorias
                .filter((item) => filtro === "todo" || item.tipo === filtro)
                .map((item) => (
                  <option
                    key={`${item.tipo}:${item.categoria}`}
                    value={`${item.tipo}:${item.categoria}`}
                  >
                    {item.categoria} ({item.tipo === "ingreso" ? "Ingreso" : "Egreso"})
                  </option>
                ))}
            </select>
          </div>
        </div>
        <MovementList
          movimientos={visibles}
          empty={
            query || filtro !== "todo" || categoria !== "todas"
              ? "Ningún movimiento coincide con los filtros."
              : "Todavía no hay movimientos."
          }
        />
      </section>
      ) : null}
    </Section>
  );
}
