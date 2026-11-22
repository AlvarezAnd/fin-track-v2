import { deflateRawSync } from 'node:zlib';
import {
  leerMovimientos,
  plantillaImportacion,
  plantillaImportacionCsv,
} from '../../src/finance/import-sheet.js';
import { crearXlsx } from '../../src/finance/xlsx.js';

describe('planilla de importación', () => {
  it('reads the template columns and rejects an empty sheet', () => {
    const resultado = leerMovimientos(plantillaImportacion());

    expect(resultado.filas).toEqual([]);
    expect(resultado.errores).toEqual(['No hay movimientos para importar.']);
  });

  it('builds a CSV template with the same header columns', () => {
    expect(plantillaImportacionCsv().toString('utf8')).toBe('\uFEFFFecha;Tipo;Moneda;Monto\n');
  });

  it('reads semicolon and comma CSV rows', () => {
    const puntoYComa = Buffer.from(
      '\uFEFFFecha;Tipo;Moneda;Monto\n13/11/2026;Egreso;usd;1.250,50\n2026-11-14;Ingreso;ARS;10\n',
      'utf8',
    );
    const coma = Buffer.from('Fecha,Tipo,Moneda,Monto\n2026-11-13,Egreso,EUR,20\n', 'utf8');

    expect(leerMovimientos(puntoYComa).filas).toEqual([
      { fecha: '2026-11-13', tipo: 'egreso', moneda: 'USD', monto: 1250.5 },
      { fecha: '2026-11-14', tipo: 'ingreso', moneda: 'ARS', monto: 10 },
    ]);
    expect(leerMovimientos(coma).filas).toEqual([
      { fecha: '2026-11-13', tipo: 'egreso', moneda: 'EUR', monto: 20 },
    ]);
    expect(leerMovimientos(plantillaImportacionCsv()).errores).toEqual([
      'No hay movimientos para importar.',
    ]);
  });

  it('accepts dates, types and amounts written as text or excel numbers', () => {
    const archivo = crearXlsx([
      {
        nombre: 'Movimientos',
        filas: [
          ['Fecha', 'Tipo', 'Moneda', 'Monto'],
          ['13/11/2026', 'Egreso', 'usd', '1.250,50'],
          [45974, 'ingreso', 'ARS', 10],
          ['', '', '', ''],
        ],
      },
    ]);

    expect(leerMovimientos(archivo).filas).toEqual([
      { fecha: '2026-11-13', tipo: 'egreso', moneda: 'USD', monto: 1250.5 },
      { fecha: serial(45974), tipo: 'ingreso', moneda: 'ARS', monto: 10 },
    ]);
  });

  it('rejects a missing column, an invalid cell and a compressed workbook', () => {
    const columnas = leerMovimientos(
      crearXlsx([
        {
          nombre: 'Movimientos',
          filas: [['Fecha', 'Tipo', 'Categoría', 'Monto']],
        },
      ]),
    );
    const celdas = leerMovimientos(
      crearXlsx([
        {
          nombre: 'Movimientos',
          filas: [
            ['Fecha', 'Tipo', 'Moneda', 'Monto'],
            ['2026-02-31', 'otro', 'BTC', '0'],
          ],
        },
      ]),
    );

    expect(columnas.errores).toEqual([
      'La primera fila debe ser Fecha, Tipo, Moneda y Monto, sin otras columnas.',
    ]);
    expect(celdas.filas).toEqual([]);
    expect(celdas.errores).toEqual([
      'Fila 2: la fecha no es válida. Usá AAAA-MM-DD.',
      'Fila 2: el tipo debe ser Ingreso o Egreso.',
      'Fila 2: la moneda debe ser ARS, USD, EUR, BRL, CLP o UYU.',
      'Fila 2: ingresá un monto mayor a cero, con hasta dos decimales.',
    ]);
    expect(leerMovimientos(comprimir(plantillaImportacion())).errores).toEqual([
      'No hay movimientos para importar.',
    ]);
    expect(leerMovimientos(libroConCadenas()).filas).toEqual([
      { fecha: serial(45974), tipo: 'egreso', moneda: 'EUR', monto: 20 },
    ]);
  });
});

function libroConCadenas() {
  const cadenas = xml(
    '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="5" uniqueCount="5"><si><t>Fecha</t></si><si><t>Tipo</t></si><si><t>Moneda</t></si><si><t>Monto</t></si><si><t>Egreso</t></si></sst>',
  );
  const hoja = xml(
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c><c r="D1" t="s"><v>3</v></c></row><row r="2"><c r="A2"><v>45974</v></c><c r="B2" t="s"><v>4</v></c><c r="C2" t="inlineStr"><is><t>EUR</t></is></c><c r="D2"><v>20</v></c></row></sheetData></worksheet>',
  );

  return zipDeflate([
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
    { name: 'xl/sharedStrings.xml', data: cadenas },
    { name: 'xl/worksheets/sheet1.xml', data: hoja },
  ]);
}

function xml(body: string) {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${body}`, 'utf8');
}

function serial(dias: number) {
  return new Date(Date.UTC(1899, 11, 30) + dias * 86_400_000).toISOString().slice(0, 10);
}

function comprimir(archivo: Buffer) {
  const fin = buscarFin(archivo);
  const cantidad = archivo.readUInt16LE(fin + 10);
  let cursor = archivo.readUInt32LE(fin + 16);
  const entradas: { name: string; data: Buffer }[] = [];

  for (let index = 0; index < cantidad; index += 1) {
    const nombreLargo = archivo.readUInt16LE(cursor + 28);
    const extra = archivo.readUInt16LE(cursor + 30);
    const comentario = archivo.readUInt16LE(cursor + 32);
    const local = archivo.readUInt32LE(cursor + 42);
    const nombre = archivo.toString('utf8', cursor + 46, cursor + 46 + nombreLargo);
    const nombreLocal = archivo.readUInt16LE(local + 26);
    const extraLocal = archivo.readUInt16LE(local + 28);
    const tamano = archivo.readUInt32LE(cursor + 20);
    const inicio = local + 30 + nombreLocal + extraLocal;
    entradas.push({ name: nombre, data: archivo.subarray(inicio, inicio + tamano) });
    cursor += 46 + nombreLargo + extra + comentario;
  }

  return zipDeflate(entradas);
}

function zipDeflate(archivos: { name: string; data: Buffer }[]) {
  const locales: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;

  for (const archivo of archivos) {
    const nombre = Buffer.from(archivo.name);
    const datos = deflateRawSync(archivo.data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(nombre.length, 26);
    local.writeUInt32LE(datos.length, 18);
    local.writeUInt32LE(archivo.data.length, 22);
    locales.push(local, nombre, datos);

    const directorio = Buffer.alloc(46);
    directorio.writeUInt32LE(0x02014b50, 0);
    directorio.writeUInt16LE(20, 4);
    directorio.writeUInt16LE(20, 6);
    directorio.writeUInt16LE(8, 10);
    directorio.writeUInt32LE(datos.length, 20);
    directorio.writeUInt32LE(archivo.data.length, 24);
    directorio.writeUInt16LE(nombre.length, 28);
    directorio.writeUInt32LE(offset, 42);
    central.push(directorio, nombre);
    offset += local.length + nombre.length + datos.length;
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

function buscarFin(archivo: Buffer) {
  for (let index = archivo.length - 22; index >= 0; index -= 1) {
    if (archivo.readUInt32LE(index) === 0x06054b50) {
      return index;
    }
  }

  return 0;
}
