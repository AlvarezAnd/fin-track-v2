import type { CodigoTipo } from '../finance/finance.validation.js';

export type CategoriaUsuario = { nombre: string; tipo: CodigoTipo };

export type ReportArgs = {
  tipo: CodigoTipo;
  categorias: string[];
  meses: number;
  agruparPor: 'categoria' | 'mes';
};

export type ReportArgsResult =
  | { ok: true; args: ReportArgs }
  | { ok: false; error: string; categorias_disponibles: string[] };

export function parseReportArgs(value: unknown, available: CategoriaUsuario[]): ReportArgsResult {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return invalid('Los argumentos tienen que ser un objeto.', available, 'egreso');
  }

  const body = value as {
    tipo?: unknown;
    categorias?: unknown;
    meses?: unknown;
    agrupar_por?: unknown;
  };
  const tipo = body.tipo == null ? 'egreso' : body.tipo;

  if (tipo !== 'egreso' && tipo !== 'ingreso') {
    return invalid("El tipo tiene que ser 'egreso' o 'ingreso'.", available, 'egreso');
  }

  const meses = body.meses;

  if (typeof meses !== 'number' || !Number.isInteger(meses) || meses < 1 || meses > 24) {
    return invalid('meses tiene que ser un entero entre 1 y 24.', available, tipo);
  }

  const agruparPor = body.agrupar_por ?? 'categoria';

  if (agruparPor !== 'categoria' && agruparPor !== 'mes') {
    return invalid("agrupar_por tiene que ser 'categoria' o 'mes'.", available, tipo);
  }

  const propias = available.filter((categoria) => categoria.tipo === tipo).map((categoria) => categoria.nombre);

  if (body.categorias == null) {
    return { ok: true, args: { tipo, categorias: [], meses, agruparPor } };
  }

  if (!Array.isArray(body.categorias) || body.categorias.some((nombre) => typeof nombre !== 'string')) {
    return invalid('categorias tiene que ser una lista de nombres.', available, tipo);
  }

  const pedidas = [...new Set(body.categorias)];
  const desconocidas = pedidas.filter((nombre) => !propias.includes(nombre));

  if (desconocidas.length > 0) {
    return {
      ok: false,
      error: `Estas categorías no existen para ${tipo}: ${desconocidas.join(', ')}.`,
      categorias_disponibles: propias,
    };
  }

  return { ok: true, args: { tipo, categorias: pedidas, meses, agruparPor } };
}

function invalid(error: string, available: CategoriaUsuario[], tipo: CodigoTipo): ReportArgsResult {
  return {
    ok: false,
    error,
    categorias_disponibles: available
      .filter((categoria) => categoria.tipo === tipo)
      .map((categoria) => categoria.nombre),
  };
}

export function recentMessages(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  for (const item of value) {
    if (item == null || typeof item !== 'object') {
      continue;
    }

    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;

    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') {
      continue;
    }

    const text = content.trim().slice(0, 2000);

    if (text) {
      messages.push({ role, content: text });
    }
  }

  return messages.slice(-8);
}
