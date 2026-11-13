import { exportarMovimientos, parseFormato, type FilaExportacion } from '../../src/finance/export.js';

const filas: FilaExportacion[] = [
  {
    fecha: '2026-11-09',
    tipo: 'ingreso',
    categoria: 'Su"eldo',
    moneda: 'ARS',
    monto: 100000,
    cotizacion: 1400,
  },
  {
    fecha: '2026-11-10',
    tipo: 'egreso',
    categoria: 'Niñez',
    moneda: 'USD',
    monto: 1250.5,
    cotizacion: 1,
  },
];

describe('exportación de movimientos', () => {
  it('acepta solo csv, excel y pdf', () => {
    expect(parseFormato('csv')).toBe('csv');
    expect(parseFormato('excel')).toBe('excel');
    expect(parseFormato('pdf')).toBe('pdf');
    expect(parseFormato('docx')).toBeNull();
  });

  it('arma un csv descargable con las columnas del historial', () => {
    const archivo = exportarMovimientos('csv', filas);
    const texto = archivo.contenido.toString('utf8');

    expect(archivo.nombre).toBe('movimientos.csv');
    expect(archivo.tipo).toContain('text/csv');
    expect(texto.charCodeAt(0)).toBe(0xfeff);
    expect(texto).toContain('Fecha;Tipo;Categoría;Moneda;Monto;Cambio');
    expect(texto).toContain('2026-11-09;Ingreso;"Su""eldo";ARS;100.000,00;1.400,00');
    expect(texto).toContain('2026-11-10;Egreso;Niñez;USD;1.250,50;1,00');
  });

  it('arma un xlsx con los movimientos en la hoja', () => {
    const archivo = exportarMovimientos('excel', filas);

    expect(archivo.nombre).toBe('movimientos.xlsx');
    expect(archivo.contenido.subarray(0, 2).toString()).toBe('PK');
    expect(archivo.contenido.toString('utf8')).toContain('Niñez');
    expect(archivo.contenido.toString('utf8')).toContain('<v>1250.5</v>');
  });

  it('arma un pdf con el título y los movimientos', () => {
    const archivo = exportarMovimientos('pdf', filas);
    const texto = archivo.contenido.toString('latin1');

    expect(archivo.nombre).toBe('movimientos.pdf');
    expect(archivo.tipo).toBe('application/pdf');
    expect(texto.startsWith('%PDF-1.4')).toBe(true);
    expect(texto).toContain('(Movimientos)');
    expect(texto).toContain('Niñez'.replace('ñ', '\\361'));
    expect(texto.trimEnd().endsWith('%%EOF')).toBe(true);
  });
});
