"use client";

import { createContext, useContext, useCallback, useLayoutEffect, useState, type ReactNode } from "react";
import { formatDesdeUsd, preferenciasIniciales, readPreferencias, writePreferencias, type Preferencias } from "@/lib/display";

type DisplaySettingsValue = {
  preferencias: Preferencias;
  cambios: Record<string, number>;
  guardar: (preferencias: Preferencias) => void;
  recargarCambios: () => Promise<void>;
  format: (usd: number) => string;
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

export function DisplaySettingsProvider({ children }: { children: ReactNode }) {
  const [preferencias, setPreferencias] = useState<Preferencias>(preferenciasIniciales);
  const [cambios, setCambios] = useState<Record<string, number>>({});

  const recargarCambios = useCallback(async () => {
    try {
      setCambios(await leerCambios());
    } catch {
      setCambios({});
    }
  }, []);

  useLayoutEffect(() => {
    setPreferencias(readPreferencias());
    void recargarCambios();
  }, [recargarCambios]);

  function guardar(next: Preferencias) {
    writePreferencias(next);
    setPreferencias(next);
  }

  return (
    <DisplaySettingsContext.Provider
      value={{
        preferencias,
        cambios,
        guardar,
        recargarCambios,
        format: (value) => formatDesdeUsd(value, preferencias.moneda, cambios),
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
