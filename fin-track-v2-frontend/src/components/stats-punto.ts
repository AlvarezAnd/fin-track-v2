import {
  clavesPeriodo,
  formatMesCorto,
  rangoPeriodo,
  type Movimiento,
  type Periodo,
} from "@/lib/finance";

export type StatsPunto = {
  clave: string;
  etiqueta: string;
  ingresos: number;
  egresos: number;
  balance: number;
};

function redondear(value: number) {
  return Math.round(value * 100) / 100;
}

export function puntosDe(
  movimientos: Movimiento[],
  periodo: Periodo,
  montoVisible: (movimiento: Movimiento) => number,
): StatsPunto[] {
  const { desde, hasta, grano } = rangoPeriodo(periodo);
  const puntos = clavesPeriodo(desde, hasta, grano).map((clave) => ({
    clave,
    etiqueta: grano === "month" ? formatMesCorto(clave) : clave.slice(8),
    ingresos: 0,
    egresos: 0,
    balance: 0,
  }));
  const indice = new Map(puntos.map((punto) => [punto.clave, punto]));

  for (const movimiento of movimientos) {
    if (movimiento.fecha < desde || movimiento.fecha > hasta) {
      continue;
    }

    const clave = grano === "month" ? movimiento.fecha.slice(0, 7) : movimiento.fecha;
    const punto = indice.get(clave);

    if (!punto) {
      continue;
    }

    const monto = montoVisible(movimiento);

    if (movimiento.tipo === "ingreso") {
      punto.ingresos += monto;
    } else {
      punto.egresos += monto;
    }
  }

  let acumulado = 0;

  for (const punto of puntos) {
    punto.ingresos = redondear(punto.ingresos);
    punto.egresos = redondear(punto.egresos);
    acumulado = redondear(acumulado + punto.ingresos - punto.egresos);
    punto.balance = acumulado;
  }

  return puntos;
}

export function redondearStats(value: number) {
  return redondear(value);
}
