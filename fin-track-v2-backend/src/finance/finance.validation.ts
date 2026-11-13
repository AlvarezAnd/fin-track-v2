export type CodigoTipo = 'ingreso' | 'egreso';

export const MONEDAS = ['ARS', 'USD', 'EUR', 'BRL', 'CLP', 'UYU'] as const;

export type MonedaCodigo = (typeof MONEDAS)[number];

export const MONEDA_REFERENCIA: MonedaCodigo = 'USD';

const TIME_ZONE = 'America/Argentina/Buenos_Aires';

export const ICONOS = [
  'etiqueta',
  'dinero',
  'comida',
  'casa',
  'transporte',
  'salud',
  'compras',
  'trabajo',
  'ocio',
  'educacion',
  'servicios',
  'regalo',
] as const;

export type Icono = (typeof ICONOS)[number];

export function parseType(value: unknown): CodigoTipo | null {
  return value === 'ingreso' || value === 'egreso' ? value : null;
}

export function parseIcon(value: unknown): Icono | undefined | null {
  if (value == null || value === '') {
    return undefined;
  }

  return typeof value === 'string' &&
    (ICONOS as readonly string[]).includes(value)
    ? (value as Icono)
    : null;
}

export function suggestedIcon(nombre: string): Icono {
  const text = nombre.toLocaleLowerCase('es-AR');

  if (/sueldo|salario|freelance|trabajo|honorario/.test(text)) return 'trabajo';
  if (/comida|super|resto|almuerzo|cena|cafe|café/.test(text)) return 'comida';
  if (/alquiler|casa|hogar|expensa/.test(text)) return 'casa';
  if (/uber|taxi|nafta|transporte|colectivo|subte/.test(text)) return 'transporte';
  if (/farmacia|salud|médico|medico|obra social/.test(text)) return 'salud';
  if (/ropa|compra|shopping/.test(text)) return 'compras';
  if (/netflix|cine|ocio|juego/.test(text)) return 'ocio';
  if (/curso|facultad|educaci[oó]n|colegio/.test(text)) return 'educacion';
  if (/luz|gas|internet|servicio|tel[eé]fono/.test(text)) return 'servicios';
  if (/regalo/.test(text)) return 'regalo';
  if (/banco|inversi[oó]n|ahorro|dinero/.test(text)) return 'dinero';

  return 'etiqueta';
}

export function parseAmount(value: unknown): number | null {
  const raw = normalizeAmount(value);

  if (!raw || !/^\d+(\.\d{1,2})?$/.test(raw)) {
    return null;
  }

  const amount = Number(raw);

  if (!Number.isFinite(amount) || amount <= 0 || amount > 999_999_999_999.99) {
    return null;
  }

  return amount;
}

function normalizeAmount(value: unknown) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return '';
    }

    return String(Math.round(value * 100) / 100);
  }

  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim().replace(/\s/g, '');
  const lastComma = trimmed.lastIndexOf(',');
  const lastDot = trimmed.lastIndexOf('.');

  if (lastComma >= 0 && lastDot >= 0) {
    return lastComma > lastDot
      ? trimmed.replaceAll('.', '').replace(',', '.')
      : trimmed.replaceAll(',', '');
  }

  if (lastComma >= 0) {
    return trimmed.replace(',', '.');
  }

  if (/^\d{1,3}(\.\d{3})+$/.test(trimmed)) {
    return trimmed.replaceAll('.', '');
  }

  return trimmed;
}

export function parseCategory(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const name = value.trim().replace(/\s+/g, ' ');

  if (!name || name.length > 80) {
    return null;
  }

  return name;
}

export function parseDate(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const valid =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  return valid ? value : null;
}

export function parseMonth(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}$/.test(value)) {
    return null;
  }

  const month = Number(value.slice(5));

  return month >= 1 && month <= 12 ? value : null;
}

export function monthBounds(mes: string) {
  const [year, month] = mes.split('-').map(Number);
  const end = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);

  return { start: `${mes}-01`, end };
}

export function currentMonth(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;

  return `${year}-${month}`;
}

export function parseMoneda(value: unknown): MonedaCodigo | null {
  return typeof value === 'string' && (MONEDAS as readonly string[]).includes(value)
    ? (value as MonedaCodigo)
    : null;
}

export function parseRate(value: unknown): number | null {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0 || value > 999_999_999_999.9999) {
      return null;
    }

    return Math.round(value * 10000) / 10000;
  }

  const raw = normalizeAmount(value);

  if (!raw || !/^\d+(\.\d{1,4})?$/.test(raw)) {
    return null;
  }

  const rate = Number(raw);

  if (!Number.isFinite(rate) || rate <= 0 || rate > 999_999_999_999.9999) {
    return null;
  }

  return Math.round(rate * 10000) / 10000;
}

export function currentDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}
