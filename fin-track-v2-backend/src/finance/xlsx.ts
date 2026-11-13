import { crc32, inflateRawSync } from 'node:zlib';

type EntradaZip = {
  name: string;
  data: Buffer;
};

type Hoja = {
  nombre: string;
  filas: (string | number)[][];
};

export function crearXlsx(hojas: Hoja[]) {
  const tipos = [
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '<Default Extension="xml" ContentType="application/xml"/>',
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
    ...hojas.map(
      (_, index) =>
        `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    ),
    '</Types>',
  ].join('');
  const hojasXml = hojas
    .map(
      (hoja, index) =>
        `<sheet name="${escapeXml(hoja.nombre)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`,
    )
    .join('');
  const relaciones = hojas
    .map(
      (_, index) =>
        `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`,
    )
    .join('');

  return zip([
    { name: '[Content_Types].xml', data: xml(tipos) },
    {
      name: '_rels/.rels',
      data: xml(
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
      ),
    },
    {
      name: 'xl/workbook.xml',
      data: xml(
        `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${hojasXml}</sheets></workbook>`,
      ),
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data: xml(
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relaciones}</Relationships>`,
      ),
    },
    ...hojas.map((hoja, index) => ({
      name: `xl/worksheets/sheet${index + 1}.xml`,
      data: xml(
        `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${hoja.filas
          .map((fila, filaIndex) => filaXml(filaIndex + 1, fila))
          .join('')}</sheetData></worksheet>`,
      ),
    })),
  ]);
}

export function leerHoja(archivo: Buffer, nombre: string): string[][] | null {
  const entradas = new Map(unzip(archivo).map((entrada) => [entrada.name, entrada.data]));
  const libro = entradas.get('xl/workbook.xml');
  const relaciones = entradas.get('xl/_rels/workbook.xml.rels');

  if (!libro || !relaciones) {
    return null;
  }

  const hoja = hojaPorNombre(libro.toString('utf8'), nombre);

  if (!hoja) {
    return null;
  }

  const destino = relaciones
    .toString('utf8')
    .match(new RegExp(`Id="${hoja}"[^>]*Target="([^"]+)"`))?.[1];

  if (!destino) {
    return null;
  }

  const ruta = destino.replace(/^\//, '').replace(/\\/g, '/');
  const xmlHoja = entradas.get(ruta.startsWith('xl/') ? ruta : `xl/${ruta}`);

  if (!xmlHoja) {
    return null;
  }

  const compartidas = entradas.has('xl/sharedStrings.xml')
    ? textosCompartidos(entradas.get('xl/sharedStrings.xml')!.toString('utf8'))
    : [];

  return grilla(xmlHoja.toString('utf8'), compartidas);
}

function hojaPorNombre(libro: string, nombre: string) {
  const buscado = normalizar(nombre);

  for (const hoja of libro.matchAll(/<sheet\b([^>]*)\/>/g)) {
    const atributos = hoja[1] ?? '';
    const titulo = atributos.match(/\bname="([^"]*)"/)?.[1] ?? '';

    if (normalizar(decodeXml(titulo)) === buscado) {
      return atributos.match(/\br:id="([^"]+)"/)?.[1] ?? '';
    }
  }

  return '';
}

function textosCompartidos(documento: string) {
  return [...documento.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((item) => {
    const bloque = (item[1] ?? '').replace(/<rPh\b[\s\S]*?<\/rPh>/g, '');
    return [...bloque.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((texto) => decodeXml(texto[1] ?? '')).join('');
  });
}

function grilla(documento: string, compartidas: string[]) {
  const filas = new Map<number, Map<number, string>>();

  for (const fila of documento.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
    const numero = Number((fila[1] ?? '').match(/\br="(\d+)"/)?.[1] ?? '0');
    const celdas = new Map<number, string>();

    for (const celda of (fila[2] ?? '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const atributos = celda[1] ?? '';
      const cuerpo = celda[2] ?? '';
      const referencia = atributos.match(/\br="([A-Z]+)\d+"/)?.[1];

      if (!referencia) {
        continue;
      }

      celdas.set(indiceColumna(referencia), valorCelda(atributos, cuerpo, compartidas));
    }

    if (numero > 0) {
      filas.set(numero, celdas);
    }
  }

  const ultima = Math.max(0, ...filas.keys());
  const resultado: string[][] = [];

  for (let numero = 1; numero <= ultima; numero += 1) {
    const celdas = filas.get(numero) ?? new Map<number, string>();
    const ancho = Math.max(0, ...celdas.keys()) + 1;
    resultado.push(Array.from({ length: ancho }, (_, index) => celdas.get(index) ?? ''));
  }

  return resultado;
}

function valorCelda(atributos: string, cuerpo: string, compartidas: string[]) {
  const tipo = atributos.match(/\bt="([^"]+)"/)?.[1] ?? '';

  if (tipo === 'inlineStr') {
    return [...cuerpo.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
      .map((texto) => decodeXml(texto[1] ?? ''))
      .join('');
  }

  const valor = decodeXml(cuerpo.match(/<v\b[^>]*>([\s\S]*?)<\/v>/)?.[1] ?? '');

  if (tipo === 's') {
    return compartidas[Number(valor)] ?? '';
  }

  return valor;
}

function indiceColumna(letras: string) {
  let indice = 0;

  for (const letra of letras) {
    indice = indice * 26 + (letra.charCodeAt(0) - 64);
  }

  return indice - 1;
}

function normalizar(value: string) {
  return value.trim().toLocaleLowerCase('es-AR');
}

function filaXml(numero: number, celdas: (string | number)[]) {
  const columnas = celdas
    .map((celda, index) => {
      const ref = `${columna(index)}${numero}`;

      if (typeof celda === 'number') {
        return `<c r="${ref}"><v>${celda}</v></c>`;
      }

      return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(celda)}</t></is></c>`;
    })
    .join('');

  return `<row r="${numero}">${columnas}</row>`;
}

function columna(indice: number) {
  let resto = indice + 1;
  let letras = '';

  while (resto > 0) {
    resto -= 1;
    letras = String.fromCharCode(65 + (resto % 26)) + letras;
    resto = Math.floor(resto / 26);
  }

  return letras;
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

function decodeXml(value: string) {
  return value
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&');
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

function unzip(archivo: Buffer): EntradaZip[] {
  const fin = buscarFin(archivo);

  if (fin < 0) {
    return [];
  }

  const cantidad = archivo.readUInt16LE(fin + 10);
  let cursor = archivo.readUInt32LE(fin + 16);
  const entradas: EntradaZip[] = [];

  for (let index = 0; index < cantidad; index += 1) {
    if (archivo.readUInt32LE(cursor) !== 0x02014b50) {
      return [];
    }

    const metodo = archivo.readUInt16LE(cursor + 10);
    const comprimido = archivo.readUInt32LE(cursor + 20);
    const nombreLargo = archivo.readUInt16LE(cursor + 28);
    const extra = archivo.readUInt16LE(cursor + 30);
    const comentario = archivo.readUInt16LE(cursor + 32);
    const local = archivo.readUInt32LE(cursor + 42);
    const nombre = archivo.toString('utf8', cursor + 46, cursor + 46 + nombreLargo);
    const nombreLocal = archivo.readUInt16LE(local + 26);
    const extraLocal = archivo.readUInt16LE(local + 28);
    const datos = archivo.subarray(local + 30 + nombreLocal + extraLocal, local + 30 + nombreLocal + extraLocal + comprimido);

    entradas.push({ name: nombre.replaceAll('\\', '/'), data: descomprimir(metodo, datos) });
    cursor += 46 + nombreLargo + extra + comentario;
  }

  return entradas;
}

function descomprimir(metodo: number, datos: Buffer) {
  if (metodo === 0) {
    return Buffer.from(datos);
  }

  if (metodo === 8) {
    return inflateRawSync(datos);
  }

  throw new Error('El archivo no es un Excel .xlsx válido.');
}

function buscarFin(archivo: Buffer) {
  const minimo = Math.max(0, archivo.length - 22 - 65535);

  for (let index = archivo.length - 22; index >= minimo; index -= 1) {
    if (archivo.readUInt32LE(index) === 0x06054b50) {
      return index;
    }
  }

  return -1;
}
