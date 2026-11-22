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

const PREFERENCIAS_EVENT = "fin-track-preferencias-cambio";

function parsePreferencias(raw: string | null): Preferencias {
  if (!raw) {
    return preferenciasIniciales;
  }

  try {
    const parsed = JSON.parse(raw) as { moneda?: unknown };
    return { moneda: monedaDe(String(parsed.moneda ?? "ARS")) };
  } catch {
    return preferenciasIniciales;
  }
}

let rawLeido: string | null | undefined;
let preferenciasLeidas = preferenciasIniciales;

/** Snapshot for useSyncExternalStore: the same object while localStorage does not change. */
export function readPreferencias(): Preferencias {
  let raw: string | null;

  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return preferenciasIniciales;
  }

  if (raw !== rawLeido) {
    rawLeido = raw;
    preferenciasLeidas = parsePreferencias(raw);
  }

  return preferenciasLeidas;
}

export function writePreferencias(preferencias: Preferencias) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferencias));
  window.dispatchEvent(new Event(PREFERENCIAS_EVENT));
}

export function subscribePreferencias(onChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY) {
      onChange();
    }
  }

  window.addEventListener(PREFERENCIAS_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(PREFERENCIAS_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
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

type MontoMovimiento = {
  monto: number;
  moneda: string;
  cotizacion: number | null;
  usd: number | null;
  tipo: "ingreso" | "egreso";
};

function redondearMonto(value: number) {
  return Math.round(value * 100) / 100;
}

/** The display currency, or USD while that currency has no stored rate. */
export function monedaVisible(moneda: Moneda, cambios: Record<string, number>): Moneda {
  return moneda === "USD" || cambios[moneda] ? moneda : "USD";
}

/**
 * Never round-trips through the rounded `usd`: a movement already in the target
 * currency keeps its exact amount, and the rest convert from the rate they were saved with.
 */
export function montoEnMoneda(
  movimiento: MontoMovimiento,
  moneda: Moneda,
  cambios: Record<string, number>,
) {
  const destino = monedaVisible(moneda, cambios);

  if (movimiento.moneda === destino) {
    return movimiento.monto;
  }

  if (destino === "USD") {
    return movimiento.usd ?? 0;
  }

  const usd =
    movimiento.moneda === "USD"
      ? movimiento.monto
      : movimiento.cotizacion
        ? movimiento.monto / movimiento.cotizacion
        : movimiento.usd;

  return usd == null ? 0 : redondearMonto(usd * cambios[destino]);
}

export function totalesEnMoneda(
  movimientos: MontoMovimiento[],
  moneda: Moneda,
  cambios: Record<string, number>,
) {
  let ingresos = 0;
  let egresos = 0;

  for (const movimiento of movimientos) {
    const monto = montoEnMoneda(movimiento, moneda, cambios);

    if (movimiento.tipo === "ingreso") {
      ingresos += monto;
    } else {
      egresos += monto;
    }
  }

  return {
    ingresos: redondearMonto(ingresos),
    egresos: redondearMonto(egresos),
    balance: redondearMonto(ingresos - egresos),
  };
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
