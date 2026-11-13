import { crc32 } from 'node:zlib';

export type FormatoExportacion = 'csv' | 'excel' | 'pdf';

export type FilaExportacion = {
  fecha: string;
  tipo: 'ingreso' | 'egreso';
  categoria: string;
  moneda: string;
  monto: number;
  cotizacion: number | null;
};

const FORMATOS: Record<FormatoExportacion, { nombre: string; tipo: string }> = {
  csv: { nombre: 'movimientos.csv', tipo: 'text/csv; charset=utf-8' },
  excel: {
    nombre: 'movimientos.xlsx',
    tipo: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  pdf: { nombre: 'movimientos.pdf', tipo: 'application/pdf' },
};

const COLUMNAS = ['Fecha', 'Tipo', 'Categoría', 'Moneda', 'Monto', 'Cambio'] as const;

export function parseFormato(value: unknown): FormatoExportacion | null {
  if (value === 'csv' || value === 'excel' || value === 'pdf') {
    return value;
  }

  return null;
}

export function exportarMovimientos(formato: FormatoExportacion, filas: FilaExportacion[]) {
  const archivo = FORMATOS[formato];
  const contenido =
    formato === 'csv' ? csv(filas) : formato === 'excel' ? excel(filas) : pdf(filas);

  return { ...archivo, contenido };
}

function etiquetaTipo(tipo: FilaExportacion['tipo']) {
  return tipo === 'ingreso' ? 'Ingreso' : 'Egreso';
}

function montoVisible(monto: number) {
  return monto.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function csv(filas: FilaExportacion[]) {
  const lineas = [
    COLUMNAS.join(';'),
    ...filas.map((fila) =>
      [
        fila.fecha,
        etiquetaTipo(fila.tipo),
        fila.categoria,
        fila.moneda,
        montoVisible(fila.monto),
        fila.cotizacion == null ? '' : montoVisible(fila.cotizacion),
      ]
        .map(campoCsv)
        .join(';'),
    ),
  ];

  return Buffer.from(`\uFEFF${lineas.join('\n')}`, 'utf8');
}

function campoCsv(value: string) {
  if (/[;"\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

function excel(filas: FilaExportacion[]) {
  const filasXml = [
    filaXml(1, COLUMNAS, true),
    ...filas.map((fila, index) =>
      filaXml(index + 2, [
        fila.fecha,
        etiquetaTipo(fila.tipo),
        fila.categoria,
        fila.moneda,
        fila.monto,
        fila.cotizacion ?? '',
      ]),
    ),
  ].join('');

  return zip([
    {
      name: '[Content_Types].xml',
      data: xml(
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
      ),
    },
    {
      name: '_rels/.rels',
      data: xml(
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
      ),
    },
    {
      name: 'xl/workbook.xml',
      data: xml(
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Movimientos" sheetId="1" r:id="rId1"/></sheets></workbook>',
      ),
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data: xml(
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
      ),
    },
    {
      name: 'xl/worksheets/sheet1.xml',
      data: xml(
        `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${filasXml}</sheetData></worksheet>`,
      ),
    },
  ]);
}

function filaXml(numero: number, celdas: ReadonlyArray<string | number>, texto = false) {
  const columnas = celdas
    .map((celda, index) => {
      const ref = `${String.fromCharCode(65 + index)}${numero}`;

      if (!texto && typeof celda === 'number') {
        return `<c r="${ref}"><v>${celda}</v></c>`;
      }

      return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(String(celda))}</t></is></c>`;
    })
    .join('');

  return `<row r="${numero}">${columnas}</row>`;
}

function xml(body: string) {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${body}`, 'utf8');
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function pdf(filas: FilaExportacion[]) {
  const paginas: string[][] = [];
  let actual: string[] = [];
  let y = 760;

  const abrir = () => {
    actual = [
      'BT',
      '/F1 16 Tf',
      `1 0 0 1 40 ${y} Tm`,
      `(${pdfTexto('Movimientos')}) Tj`,
      '/F1 10 Tf',
    ];
    y -= 28;
    actual.push(...pdfCeldas(y, COLUMNAS.map(String), true));
    y -= 18;
  };

  abrir();

  for (const fila of filas) {
    if (y < 48) {
      actual.push('ET');
      paginas.push(actual);
      y = 800;
      abrir();
    }

    actual.push(
      ...pdfCeldas(y, [
        fila.fecha,
        etiquetaTipo(fila.tipo),
        fila.categoria,
        fila.moneda,
        montoVisible(fila.monto),
        fila.cotizacion == null ? '' : montoVisible(fila.cotizacion),
      ]),
    );
    y -= 16;
  }

  actual.push('ET');
  paginas.push(actual);
  return documentoPdf(paginas.map((pagina) => pagina.join('\n')));
}

function pdfCeldas(y: number, celdas: string[], encabezado = false) {
  const x = [40, 105, 160, 300, 360, 450];
  const comando = encabezado ? '/F1 10 Tf' : '';

  return celdas.flatMap((celda, index) => {
    const texto = encabezado ? celda : recortar(celda, index === 2 ? 34 : 18);
    const linea = [`1 0 0 1 ${x[index]} ${y} Tm`, `(${pdfTexto(texto)}) Tj`];
    return comando && index === 0 ? [comando, ...linea] : linea;
  });
}

function recortar(value: string, maximo: number) {
  const caracteres = Array.from(value);

  if (caracteres.length <= maximo) {
    return value;
  }

  return `${caracteres.slice(0, maximo - 1).join('')}…`;
}

function pdfTexto(value: string) {
  let texto = '';

  for (const caracter of value) {
    const codigo = caracter.codePointAt(0) ?? 63;
    const byte = codigo <= 255 ? codigo : 63;

    if (byte === 0x5c || byte === 0x28 || byte === 0x29) {
      texto += `\\${String.fromCharCode(byte)}`;
      continue;
    }

    if (byte < 32 || byte > 126) {
      texto += `\\${byte.toString(8).padStart(3, '0')}`;
      continue;
    }

    texto += String.fromCharCode(byte);
  }

  return texto;
}

function documentoPdf(paginas: string[]) {
  const objetos = new Map<number, string>();
  const paginasId: number[] = [];
  const contenidosId: number[] = [];
  let siguiente = 4;

  for (const contenido of paginas) {
    paginasId.push(siguiente);
    siguiente += 1;
    contenidosId.push(siguiente);
    siguiente += 1;
    objetos.set(
      paginasId.at(-1)!,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${contenidosId.at(-1)} 0 R /Resources << /Font << /F1 3 0 R >> >> >>`,
    );
    objetos.set(
      contenidosId.at(-1)!,
      `<< /Length ${Buffer.byteLength(contenido, 'utf8')} >>\nstream\n${contenido}\nendstream`,
    );
  }

  objetos.set(1, '<< /Type /Catalog /Pages 2 0 R >>');
  objetos.set(
    2,
    `<< /Type /Pages /Kids [${paginasId.map((id) => `${id} 0 R`).join(' ')}] /Count ${paginasId.length} >>`,
  );
  objetos.set(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');

  const partes: Buffer[] = [Buffer.from('%PDF-1.4\n')];
  const offsets = [0];

  for (let id = 1; id < siguiente; id += 1) {
    offsets.push(partes.reduce((total, parte) => total + parte.length, 0));
    partes.push(Buffer.from(`${id} 0 obj\n${objetos.get(id)}\nendobj\n`, 'utf8'));
  }

  const xref = partes.reduce((total, parte) => total + parte.length, 0);
  const tabla = [
    'xref',
    `0 ${siguiente}`,
    '0000000000 65535 f ',
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `),
    'trailer',
    `<< /Size ${siguiente} /Root 1 0 R >>`,
    'startxref',
    String(xref),
    '%%EOF',
  ];
  partes.push(Buffer.from(`${tabla.join('\n')}\n`, 'utf8'));
  return Buffer.concat(partes);
}

function zip(archivos: { name: string; data: Buffer }[]) {
  const locales: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;

  for (const archivo of archivos) {
    const nombre = Buffer.from(archivo.name);
    const crc = crc32(archivo.data) >>> 0;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(nombre.length, 26);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(archivo.data.length, 18);
    local.writeUInt32LE(archivo.data.length, 22);
    locales.push(local, nombre, archivo.data);

    const directorio = Buffer.alloc(46);
    directorio.writeUInt32LE(0x02014b50, 0);
    directorio.writeUInt16LE(20, 4);
    directorio.writeUInt16LE(20, 6);
    directorio.writeUInt32LE(crc, 16);
    directorio.writeUInt32LE(archivo.data.length, 20);
    directorio.writeUInt32LE(archivo.data.length, 24);
    directorio.writeUInt16LE(nombre.length, 28);
    directorio.writeUInt32LE(offset, 42);
    central.push(directorio, nombre);
    offset += local.length + nombre.length + archivo.data.length;
  }

  const directorio = Buffer.concat(central);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  fin.writeUInt16LE(archivos.length, 8);
  fin.writeUInt16LE(archivos.length, 10);
  fin.writeUInt32LE(directorio.length, 12);
  fin.writeUInt32LE(offset, 16);
  return Buffer.concat([...locales, directorio, fin]);
}
