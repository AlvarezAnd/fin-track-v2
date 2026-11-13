import { aggregateReport, reportRange } from '../../src/assistant/assistant.report.js';

const november = new Date('2026-11-13T15:00:00Z');

describe('reportRange', () => {
  it('includes the current month and walks backward in Buenos Aires', () => {
    expect(reportRange(1, november)).toMatchObject({
      start: '2026-11-01',
      end: '2026-12-01',
      desde: '2026-11-01',
      hasta: '2026-11-30',
    });
    expect(reportRange(3, november)).toMatchObject({
      start: '2026-09-01',
      end: '2026-12-01',
    });
    expect(reportRange(14, november).start).toBe('2025-10-01');
  });
});

describe('aggregateReport', () => {
  it('converts each movement to dollars and groups the totals', () => {
    const rows = [
      { monto: 10, moneda: 'USD', cotizacion: 1, fecha: '2026-11-02', categoria: 'Comida' },
      { monto: 1550, moneda: 'ARS', cotizacion: 1550, fecha: '2026-11-03', categoria: 'Comida' },
      { monto: 4, moneda: 'EUR', cotizacion: 2, fecha: '2026-10-01', categoria: 'Transporte' },
      { monto: 9, moneda: 'EUR', cotizacion: null, fecha: '2026-10-02', categoria: 'Transporte' },
    ];

    expect(aggregateReport(rows, new Map(), 'categoria')).toEqual({
      total: 13,
      grupos: [
        { clave: 'Comida', total: 11 },
        { clave: 'Transporte', total: 2 },
      ],
    });
    expect(aggregateReport(rows, new Map(), 'mes').grupos).toEqual([
      { clave: '2026-10', total: 2 },
      { clave: '2026-11', total: 11 },
    ]);
  });
});
