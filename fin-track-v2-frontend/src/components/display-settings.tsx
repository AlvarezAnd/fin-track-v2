"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  formatMoneda,
  monedaVisible,
  preferenciasIniciales,
  readPreferencias,
  subscribePreferencias,
  totalesEnMoneda,
  writePreferencias,
  type Preferencias,
} from "@/lib/display";
import type { Movimiento } from "@/lib/finance";

type DisplaySettingsValue = {
  preferencias: Preferencias;
  cambios: Record<string, number>;
  cambiosCargados: boolean;
  guardar: (preferencias: Preferencias) => void;
  recargarCambios: () => Promise<void>;
  /** Formats an amount already expressed in the visible currency. */
  format: (monto: number) => string;
  totales: (movimientos: Movimiento[]) => { ingresos: number; egresos: number; balance: number };
};

const DisplaySettingsContext = createContext<DisplaySettingsValue | null>(null);

async function leerCambios() {
  const response = await fetch("/api/finanzas/cotizaciones", { cache: "no-store" });

  if (!response.ok) {
    return {};
  }

  const rows = (await response.json()) as { moneda?: unknown; valor?: unknown }[];

  return Object.fromEntries(
    rows.flatMap((row) =>
      typeof row.moneda === "string" && typeof row.valor === "number" ? [[row.moneda, row.valor]] : [],
    ),
  );
}

/** A failed request leaves the rates empty, so totals fall back to USD. */
function leerCambiosOVacio() {
  return leerCambios().catch((): Record<string, number> => ({}));
}

export function DisplaySettingsProvider({ children }: { children: ReactNode }) {
  // The server and the hydration render use the defaults; localStorage applies right after.
  const preferencias = useSyncExternalStore(
    subscribePreferencias,
    readPreferencias,
    () => preferenciasIniciales,
  );
  const [cambios, setCambios] = useState<Record<string, number>>({});
  const [cambiosCargados, setCambiosCargados] = useState(false);

  const aplicarCambios = useCallback((siguientes: Record<string, number>) => {
    setCambios(siguientes);
    setCambiosCargados(true);
  }, []);

  const recargarCambios = useCallback(async () => {
    aplicarCambios(await leerCambiosOVacio());
  }, [aplicarCambios]);

  useEffect(() => {
    let activo = true;

    void leerCambiosOVacio().then((siguientes) => {
      if (activo) {
        aplicarCambios(siguientes);
      }
    });

    return () => {
      activo = false;
    };
  }, [aplicarCambios]);

  function guardar(next: Preferencias) {
    writePreferencias(next);
  }

  return (
    <DisplaySettingsContext.Provider
      value={{
        preferencias,
        cambios,
        cambiosCargados,
        guardar,
        recargarCambios,
        format: (monto) => formatMoneda(monto, monedaVisible(preferencias.moneda, cambios)),
        totales: (movimientos) => totalesEnMoneda(movimientos, preferencias.moneda, cambios),
      }}
    >
      {children}
    </DisplaySettingsContext.Provider>
  );
}

export function useDisplaySettings() {
  const value = useContext(DisplaySettingsContext);

  if (!value) {
    throw new Error("Las preferencias de visualización no están disponibles.");
  }

  return value;
}
