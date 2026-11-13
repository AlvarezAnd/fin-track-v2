export const MONEDAS = [
  { id: "ARS", nombre: "Peso argentino", unidad: "peso" },
  { id: "USD", nombre: "Dólar", unidad: "dólar" },
  { id: "EUR", nombre: "Euro", unidad: "euro" },
  { id: "BRL", nombre: "Real", unidad: "real" },
  { id: "CLP", nombre: "Peso chileno", unidad: "peso chileno" },
  { id: "UYU", nombre: "Peso uruguayo", unidad: "peso uruguayo" },
] as const;

export type Moneda = (typeof MONEDAS)[number]["id"];

export type Preferencias = {
  moneda: Moneda;
};

const STORAGE_KEY = "fin-track-preferencias";

export const preferenciasIniciales: Preferencias = {
  moneda: "ARS",
};

export function monedaDe(id: string): Moneda {
  return MONEDAS.some((item) => item.id === id) ? (id as Moneda) : "ARS";
}

export function nombreMoneda(id: Moneda) {
  return MONEDAS.find((item) => item.id === id)?.nombre ?? "Peso argentino";
}

export function unidadMoneda(id: Moneda) {
  return MONEDAS.find((item) => item.id === id)?.unidad ?? "peso";
}

export function readPreferencias(): Preferencias {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return preferenciasIniciales;
    }

    const parsed = JSON.parse(raw) as { moneda?: unknown };
    return { moneda: monedaDe(String(parsed.moneda ?? "ARS")) };
  } catch {
    return preferenciasIniciales;
  }
}

export function writePreferencias(preferencias: Preferencias) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferencias));
}

export function parseEquivalencia(value: string) {
  const trimmed = value.trim().replace(/\s/g, "");

  if (!trimmed) {
    return null;
  }

  let normalized = trimmed;

  if (trimmed.includes(",")) {
    normalized = trimmed.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(trimmed)) {
    normalized = trimmed.replace(/\./g, "");
  }

  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Math.round(amount * 10000) / 10000;
}

export function montoDesdeUsd(value: number, moneda: Moneda, cambios: Record<string, number>) {
  if (moneda === "USD") {
    return value;
  }

  const cambio = cambios[moneda];

  if (!cambio) {
    return null;
  }

  return Math.round(value * cambio * 100) / 100;
}

const formatters = new Map<Moneda, Intl.NumberFormat>();

export function formatMoneda(value: number, moneda: Moneda) {
  let formatter = formatters.get(moneda);

  if (!formatter) {
    formatter = new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: moneda,
    });
    formatters.set(moneda, formatter);
  }

  return formatter.format(value);
}

export function formatDesdeUsd(value: number, moneda: Moneda, cambios: Record<string, number>) {
  const convertido = montoDesdeUsd(value, moneda, cambios);

  if (convertido == null) {
    return formatMoneda(value, "USD");
  }

  return formatMoneda(convertido, moneda);
}
