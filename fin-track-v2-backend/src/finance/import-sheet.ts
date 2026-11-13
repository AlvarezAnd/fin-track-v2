import {
  parseAmount,
  parseDate,
  parseMoneda,
  parseType,
  type CodigoTipo,
  type MonedaCodigo,
} from './finance.validation.js';
import { crearXlsx, leerHoja } from './xlsx.js';

export const CATEGORIA_IMPORTADA = 'Importado';
const MAXIMO_FILAS = 500;
const ENCABEZADO = ['fecha', 'tipo', 'moneda', 'monto'] as const;

export type FilaImportada = {
  fecha: string;
  tipo: CodigoTipo;
  moneda: MonedaCodigo;
  monto: number;
};

export function plantillaImportacion() {
  return crearXlsx([
    {
      nombre: 'Movimientos',
      filas: [['Fecha', 'Tipo', 'Moneda', 'Monto']],
    },
    {
      nombre: 'Instrucciones',
      filas: [
        ['Completá la hoja Movimientos. No agregues columnas ni una columna de categoría.'],
        ['Fecha: AAAA-MM-DD, o DD/MM/AAAA.'],
        ['Tipo: Ingreso o Egreso.'],
        ['Moneda: ARS, USD, EUR, BRL, CLP o UYU.'],
        ['Monto: número mayor a cero, con hasta dos decimales. También vale 1.250,50.'],
        ['Cada fila importada se guarda en la categoría Importado.'],
      ],
    },
  ]);
}

export function leerMovimientos(archivo: Buffer): { filas: FilaImportada[]; errores: string[] } {
  if (archivo.length < 4 || archivo.readUInt32LE(0) !== 0x04034b50) {
    return { filas: [], errores: ['El archivo no es un Excel .xlsx válido.'] };
  }

  let hoja: string[][] | null;

  try {
    hoja = leerHoja(archivo, 'Movimientos');
  } catch {
    return { filas: [], errores: ['El archivo no es un Excel .xlsx válido.'] };
  }

  if (!hoja) {
    return { filas: [], errores: ['El archivo no tiene la hoja Movimientos.'] };
  }

  const encabezado = (hoja[0] ?? []).map((celda) => normalizar(celda));
  const columnas = encabezado.filter((celda) => celda.length > 0);

  if (columnas.length !== ENCABEZADO.length || ENCABEZADO.some((celda, index) => columnas[index] !== celda)) {
    return {
      filas: [],
      errores: ['La primera fila debe ser Fecha, Tipo, Moneda y Monto, sin otras columnas.'],
    };
  }

  const ocupadas = hoja.slice(1).filter((celdas) => celdas.some((celda) => celda.trim())).length;

  if (ocupadas > MAXIMO_FILAS) {
    return { filas: [], errores: ['Importá hasta 500 movimientos por archivo.'] };
  }

  const filas: FilaImportada[] = [];
  const errores: string[] = [];

  for (let index = 1; index < hoja.length; index += 1) {
    const celdas = hoja[index] ?? [];
    const fecha = (celdas[0] ?? '').trim();
    const tipo = (celdas[1] ?? '').trim();
    const moneda = (celdas[2] ?? '').trim();
    const monto = (celdas[3] ?? '').trim();

    if (!fecha && !tipo && !moneda && !monto) {
      continue;
    }

    const numero = index + 1;
    const fechaValida = parseFecha(fecha);
    const tipoValido = parseType(normalizar(tipo));
    const monedaValida = parseMoneda(moneda.toUpperCase());
    const montoValido = parseAmount(monto);

    if (!fecha) {
      errores.push(`Fila ${numero}: completá la fecha.`);
    } else if (!fechaValida) {
      errores.push(`Fila ${numero}: la fecha no es válida. Usá AAAA-MM-DD.`);
    }

    if (!tipo) {
      errores.push(`Fila ${numero}: completá el tipo.`);
    } else if (!tipoValido) {
      errores.push(`Fila ${numero}: el tipo debe ser Ingreso o Egreso.`);
    }

    if (!moneda) {
      errores.push(`Fila ${numero}: completá la moneda.`);
    } else if (!monedaValida) {
      errores.push(`Fila ${numero}: la moneda debe ser ARS, USD, EUR, BRL, CLP o UYU.`);
    }

    if (!monto) {
      errores.push(`Fila ${numero}: completá el monto.`);
    } else if (montoValido == null) {
      errores.push(`Fila ${numero}: ingresá un monto mayor a cero, con hasta dos decimales.`);
    }

    if (fechaValida && tipoValido && monedaValida && montoValido != null) {
      filas.push({ fecha: fechaValida, tipo: tipoValido, moneda: monedaValida, monto: montoValido });
    }
  }

  if (errores.length > 0) {
    const visibles = errores.slice(0, 20);

    if (errores.length > visibles.length) {
      visibles.push(`Y ${errores.length - visibles.length} observaciones más.`);
    }

    return { filas: [], errores: visibles };
  }

  if (filas.length === 0) {
    return { filas: [], errores: ['No hay movimientos para importar.'] };
  }

  return { filas, errores: [] };
}

function parseFecha(value: string) {
  const directa = parseDate(value);

  if (directa) {
    return directa;
  }

  const textual = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(value);

  if (textual) {
    const dia = textual[1]?.padStart(2, '0');
    const mes = textual[2]?.padStart(2, '0');
    return parseDate(`${textual[3]}-${mes}-${dia}`);
  }

  if (/^\d+(\.\d+)?$/.test(value)) {
    const dias = Math.floor(Number(value));
    const iso = new Date(Date.UTC(1899, 11, 30) + dias * 86_400_000).toISOString().slice(0, 10);
    const anio = Number(iso.slice(0, 4));

    if (anio >= 1970 && anio <= 2100) {
      return parseDate(iso);
    }
  }

  return null;
}

function normalizar(value: string) {
  return value.trim().toLocaleLowerCase('es-AR');
}
