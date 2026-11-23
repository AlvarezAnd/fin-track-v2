import type { Moneda } from "@/lib/display";

export type TipoMovimiento = "ingreso" | "egreso";

export type CategoriaResumen = {
  nombre: string;
  icono: string;
};

export type Movimiento = {
  id: number;
  monto: number;
  moneda: Moneda;
  cotizacion: number | null;
  usd: number | null;
  fecha: string;
  tipo: TipoMovimiento;
  categoria: string;
  icono: string;
  detalle: string | null;
};

export type PanelFinanciero = {
  mes: string;
  balance: number;
  ingresos: number;
  egresos: number;
  categorias: Record<TipoMovimiento, CategoriaResumen[]>;
  movimientos: Movimiento[];
};

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
});

/** Calendar dates follow America/Argentina/Buenos_Aires, same as the API. */
const TIME_ZONE = "America/Argentina/Buenos_Aires";

function parteFecha(
  date: Date,
  type: "year" | "month" | "day",
) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(date)
    .find((part) => part.type === type)?.value;
}

export function fechaLocal(date = new Date()) {
  const year = parteFecha(date, "year");
  const month = parteFecha(date, "month");
  const day = parteFecha(date, "day");
  return `${year}-${month}-${day}`;
}

export function mesActual(date = new Date()) {
  return fechaLocal(date).slice(0, 7);
}

export function mesAnterior(date = new Date()) {
  const [year, month] = mesActual(date).split("-").map(Number);
  const anterior = month === 1 ? 12 : month - 1;
  const anio = month === 1 ? year - 1 : year;
  return `${anio}-${String(anterior).padStart(2, "0")}`;
}

export function formatMonto(value: number) {
  return money.format(value);
}

export function formatMes(mes: string) {
  const [year, month] = mes.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export function formatFecha(fecha: string) {
  const [year, month, day] = fecha.split("-");
  return `${day}/${month}/${year}`;
}

export function formatMesCorto(mes: string) {
  const [year, month] = mes.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", { month: "short" })
    .format(new Date(year, month - 1, 1))
    .replace(".", "");
}

export type Periodo = "dia" | "mes" | "3m" | "6m" | "anio";

export function rangoPeriodo(periodo: Periodo, today = new Date()) {
  const hasta = fechaLocal(today);
  const mes = mesActual(today);

  if (periodo === "dia") {
    return { desde: hasta, hasta, grano: "day" as const };
  }

  if (periodo === "mes") {
    return {
      desde: `${mes}-01`,
      hasta,
      grano: "day" as const,
    };
  }

  const meses = periodo === "3m" ? 3 : periodo === "6m" ? 6 : 12;
  let [year, month] = mes.split("-").map(Number);
  month -= meses - 1;
  while (month <= 0) {
    month += 12;
    year -= 1;
  }

  return {
    desde: `${year}-${String(month).padStart(2, "0")}-01`,
    hasta,
    grano: "month" as const,
  };
}

export function clavesPeriodo(
  desde: string,
  hasta: string,
  grano: "day" | "month",
) {
  if (grano === "month") {
    const keys: string[] = [];
    let year = Number(desde.slice(0, 4));
    let month = Number(desde.slice(5, 7));
    const endYear = Number(hasta.slice(0, 4));
    const endMonth = Number(hasta.slice(5, 7));

    while (year < endYear || (year === endYear && month <= endMonth)) {
      keys.push(`${year}-${String(month).padStart(2, "0")}`);
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }

    return keys;
  }

  const keys: string[] = [];
  let cursor = Date.parse(`${desde}T00:00:00Z`);
  const end = Date.parse(`${hasta}T00:00:00Z`);

  while (cursor <= end) {
    keys.push(new Date(cursor).toISOString().slice(0, 10));
    cursor += 86_400_000;
  }

  return keys;
}

export function movimientoCoincide(
  movimiento: Movimiento,
  query: string,
  visible = formatMonto(movimiento.monto),
) {
  const text = query.trim().toLocaleLowerCase("es-AR");

  if (!text) {
    return true;
  }

  if (movimiento.categoria.toLocaleLowerCase("es-AR").includes(text)) {
    return true;
  }

  const [entero, decimales = "00"] = movimiento.monto.toFixed(2).split(".");
  const digits = text.replace(/\D/g, "");
  const formatted = formatMonto(movimiento.monto).toLocaleLowerCase("es-AR");
  const shown = visible.toLocaleLowerCase("es-AR");
  const shownEntero = shown.split(",")[0]?.replace(/\D/g, "") ?? "";

  return (
    formatted.includes(text) ||
    shown.includes(text) ||
    `${entero},${decimales}`.includes(text) ||
    `${entero}.${decimales}`.includes(text) ||
    (digits.length > 0 && (entero.includes(digits) || shownEntero.includes(digits)))
  );
}
