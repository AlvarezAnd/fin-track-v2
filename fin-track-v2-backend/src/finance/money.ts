import { MONEDA_REFERENCIA } from './finance.validation.js';

export type MoneyMovement = {
  monto: number;
  moneda: string;
  cotizacion: number | null;
};

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function amountInUsd(movimiento: MoneyMovement, cambios: Map<string, number>) {
  if (movimiento.moneda === MONEDA_REFERENCIA) {
    return roundMoney(movimiento.monto);
  }

  const cambio = movimiento.cotizacion ?? cambios.get(movimiento.moneda);

  if (!cambio) {
    return null;
  }

  return roundMoney(movimiento.monto / cambio);
}
