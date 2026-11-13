"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import { Button } from "@/components/button";
import { useDisplaySettings } from "@/components/display-settings";
import { suggestCategoryIcon } from "@/components/category-icon-data";
import { IconPicker } from "@/components/icon-picker";
import { ArrowDownLeft } from "@/components/icons/arrow-down-left";
import { ArrowUpRight } from "@/components/icons/arrow-up-right";
import { Tabs } from "@/components/tabs";
import {
  MONEDAS,
  parseEquivalencia,
  unidadMoneda,
  type Moneda,
} from "@/lib/display";
import {
  fechaLocal,
  mesActual,
  type CategoriaResumen,
  type Movimiento,
  type PanelFinanciero,
  type TipoMovimiento,
} from "@/lib/finance";

const inputClassName =
  "h-12 rounded-lg border border-black/10 bg-transparent px-3 text-base font-normal outline-none focus:border-foreground sm:h-11 dark:border-white/15";

export type MovementDraft =
  | { mode: "create"; tipo: TipoMovimiento }
  | { mode: "edit"; movimiento: Movimiento };

function montoInicial(monto: number) {
  return monto.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function MovementDialog({
  draft,
  administrador,
  onClose,
  onSaved,
}: {
  draft: MovementDraft;
  administrador: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { recargarCambios } = useDisplaySettings();
  const titleId = useId();
  const listId = useId();
  const editing = draft.mode === "edit";
  const [tipo, setTipo] = useState<TipoMovimiento>(
    editing ? draft.movimiento.tipo : draft.tipo,
  );
  const [monto, setMonto] = useState(editing ? montoInicial(draft.movimiento.monto) : "");
  const [moneda, setMoneda] = useState<Moneda>(editing ? draft.movimiento.moneda : "USD");
  const [cambio, setCambio] = useState("");
  const [cotizaciones, setCotizaciones] = useState<Record<string, number>>({});
  const [categoria, setCategoria] = useState(editing ? draft.movimiento.categoria : "");
  const [fecha, setFecha] = useState(editing ? draft.movimiento.fecha : fechaLocal());
  const [icono, setIcono] = useState(editing ? draft.movimiento.icono : "etiqueta");
  const [iconTouched, setIconTouched] = useState(editing);
  const [categorias, setCategorias] = useState<Record<TipoMovimiento, CategoriaResumen[]>>({
    ingreso: [],
    egreso: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const titulo = editing ? "Editar movimiento" : "Nuevo movimiento";

  useEffect(() => {
    let active = true;

    void (async () => {
      const response = await fetch(`/api/finanzas?mes=${mesActual()}`, {
        cache: "no-store",
      });

      if (!active) {
        return;
      }

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }

      if (!response.ok) {
        return;
      }

      const panel = (await response.json()) as PanelFinanciero;
      setCategorias(panel.categorias);
      const rates = await fetch("/api/finanzas/cotizaciones", { cache: "no-store" });

      if (!active || !rates.ok) {
        return;
      }

      const rows = (await rates.json()) as { moneda?: unknown; valor?: unknown }[];
      setCotizaciones(
        Object.fromEntries(
          rows.flatMap((row) =>
            typeof row.moneda === "string" && typeof row.valor === "number"
              ? [[row.moneda, row.valor]]
              : [],
          ),
        ),
      );
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, pending]);

  function applyCategoria(value: string, nextTipo = tipo) {
    setCategoria(value);

    if (iconTouched) {
      return;
    }

    const match = categorias[nextTipo].find(
      (item) => item.nombre.toLocaleLowerCase("es-AR") === value.toLocaleLowerCase("es-AR"),
    );
    setIcono(match?.icono ?? suggestCategoryIcon(value));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const faltaCambio = moneda !== "USD" && cotizaciones[moneda] == null;

    if (faltaCambio) {
      if (!administrador) {
        setError("Un administrador tiene que registrar el cambio de esta moneda.");
        setPending(false);
        return;
      }

      const valor = parseEquivalencia(cambio);

      if (!valor) {
        setError(`Indicá a cuántos ${unidadMoneda(moneda)} equivale 1 dólar.`);
        setPending(false);
        return;
      }

      const rateResponse = await fetch(`/api/finanzas/cotizaciones/${moneda}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ valor }),
      });

      if (rateResponse.status === 401) {
        window.location.assign("/login");
        return;
      }

      if (!rateResponse.ok) {
        setError("No se pudo guardar el cambio de la moneda.");
        setPending(false);
        return;
      }

      await recargarCambios();
    }

    const path = editing ? `/api/finanzas/${draft.movimiento.id}` : "/api/finanzas";

    try {
      const response = await fetch(path, {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tipo,
          monto,
          categoria,
          fecha,
          icono,
          moneda,
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        message?: unknown;
        error?: unknown;
      } | null;

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }

      if (!response.ok) {
        const message = body?.message ?? body?.error;
        setError(
          typeof message === "string"
            ? message
            : editing
              ? "No se pudo guardar el movimiento."
              : "No se pudo registrar el movimiento.",
        );
        setPending(false);
        return;
      }

      onSaved();
    } catch {
      setError(editing ? "No se pudo guardar el movimiento." : "No se pudo registrar el movimiento.");
      setPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[min(92dvh,44rem)] w-full overflow-y-auto rounded-t-2xl border border-black/10 bg-background p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:max-w-md sm:rounded-2xl sm:p-6 dark:border-white/15"
      >
        <h2 id={titleId} className="text-lg font-semibold">
          {titulo}
        </h2>
        <div className="mt-4">
          <Tabs
            label="Tipo de movimiento"
            value={tipo}
            onChange={setTipo}
            disabled={pending}
            options={[
              {
                id: "ingreso",
                label: "Ingreso",
                icon: <ArrowDownLeft />,
                className:
                  "text-emerald-800 hover:text-emerald-950 dark:text-emerald-400 dark:hover:text-emerald-300",
                selectedClassName:
                  "bg-emerald-800 text-white shadow-xs dark:bg-emerald-900",
              },
              { id: "egreso", label: "Egreso", icon: <ArrowUpRight /> },
            ]}
          />
        </div>
        <form className="mt-5 flex flex-col gap-4" onSubmit={onSubmit}>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Monto
            <input
              name="monto"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              required
              autoFocus
              placeholder="0,00"
              value={monto}
              onChange={(event) => setMonto(event.target.value)}
              className={inputClassName}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Moneda
            <select
              name="moneda"
              value={moneda}
              disabled={pending}
              onChange={(event) => setMoneda(event.target.value as Moneda)}
              className={inputClassName}
            >
              {MONEDAS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </label>
          {moneda !== "USD" && cotizaciones[moneda] == null ? (
            administrador ? (
              <label className="flex flex-col gap-2 text-sm font-medium">
                Cambio
                <span className="font-normal text-zinc-500 dark:text-zinc-400">
                  1 dólar equivale a
                </span>
                <span className="flex items-center gap-3">
                  <input
                    name="cambio"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    required
                    value={cambio}
                    onChange={(event) => setCambio(event.target.value)}
                    placeholder="0,00"
                    aria-label={`Unidades de ${unidadMoneda(moneda)} por dólar`}
                    className={inputClassName}
                  />
                  <span className="shrink-0 text-sm font-normal text-zinc-500 dark:text-zinc-400">
                    {unidadMoneda(moneda)}
                  </span>
                </span>
              </label>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400" role="status">
                Un administrador tiene que registrar el cambio de esta moneda antes de usarla.
              </p>
            )
          ) : null}
          <label className="flex flex-col gap-2 text-sm font-medium">
            Fecha
            <input
              name="fecha"
              type="date"
              required
              value={fecha}
              onChange={(event) => setFecha(event.target.value)}
              className={inputClassName}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Categoría
            <input
              name="categoria"
              type="text"
              list={listId}
              autoComplete="off"
              required
              maxLength={80}
              value={categoria}
              onChange={(event) => applyCategoria(event.target.value)}
              className={inputClassName}
            />
            <datalist id={listId}>
              {categorias[tipo].map((item) => (
                <option key={item.nombre} value={item.nombre} />
              ))}
            </datalist>
          </label>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Icono</p>
            <IconPicker
              value={icono}
              disabled={pending}
              onChange={(name) => {
                setIconTouched(true);
                setIcono(name);
              }}
            />
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
            <Button
              variant="primary"
              type="submit"
              disabled={pending || (moneda !== "USD" && cotizaciones[moneda] == null && !administrador)}
            >
              {pending ? "Guardando…" : editing ? "Guardar" : "Registrar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
