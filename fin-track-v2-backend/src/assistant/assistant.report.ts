import { amountInUsd, roundMoney, type MoneyMovement } from '../finance/money.js';
import { currentMonth } from '../finance/finance.validation.js';

export type ReportRow = MoneyMovement & {
  fecha: string;
  categoria: string;
};

export function reportRange(meses: number, date = new Date()) {
  const current = currentMonth(date);
  const [year, month] = current.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - meses, 1)).toISOString().slice(0, 10);
  const end = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
  const inclusiveEnd = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);

  return { start, end, desde: start, hasta: inclusiveEnd };
}

export function aggregateReport(
  rows: ReportRow[],
  cambios: Map<string, number>,
  agruparPor: 'categoria' | 'mes',
) {
  const buckets = new Map<string, number>();

  for (const row of rows) {
    const usd = amountInUsd(row, cambios);

    if (usd == null) {
      continue;
    }

    const clave = agruparPor === 'mes' ? row.fecha.slice(0, 7) : row.categoria;
    buckets.set(clave, (buckets.get(clave) ?? 0) + usd);
  }

  const grupos = [...buckets.entries()].map(([clave, total]) => ({
    clave,
    total: roundMoney(total),
  }));

  if (agruparPor === 'mes') {
    grupos.sort((left, right) => left.clave.localeCompare(right.clave));
  } else {
    grupos.sort((left, right) => right.total - left.total || left.clave.localeCompare(right.clave));
  }

  return {
    total: roundMoney(grupos.reduce((sum, grupo) => sum + grupo.total, 0)),
    grupos,
  };
}
