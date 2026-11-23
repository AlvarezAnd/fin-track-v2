import {
  suggestedIcon,
  monthBounds,
  parseCategory,
  parseDate,
  parseDetail,
  parseIcon,
  parseMonth,
  parseAmount,
  parseType,
} from '../../src/finance/finance.validation.js';

describe('finance validation', () => {
  it('accepts an income or expense type', () => {
    expect(parseType('ingreso')).toBe('ingreso');
    expect(parseType('egreso')).toBe('egreso');
    expect(parseType('otro')).toBeNull();
  });

  it('accepts a positive amount with up to two decimals', () => {
    expect(parseAmount('1.250,50')).toBe(1250.5);
    expect(parseAmount('1250,5')).toBe(1250.5);
    expect(parseAmount('1,250.50')).toBe(1250.5);
    expect(parseAmount('1.250')).toBe(1250);
    expect(parseAmount('0')).toBeNull();
    expect(parseAmount('10.9999')).toBeNull();
  });

  it('parses an optional detail', () => {
    expect(parseDetail(undefined)).toBeUndefined();
    expect(parseDetail('   ')).toBeUndefined();
    expect(parseDetail('  Compra del mes ')).toBe('Compra del mes');
    expect(parseDetail('x'.repeat(200))).toBe('x'.repeat(200));
    expect(parseDetail('x'.repeat(201))).toBeNull();
    expect(parseDetail(5)).toBeNull();
  });

  it('normalizes a category and a calendar month', () => {
    expect(parseCategory('  Sueldo   neto ')).toBe('Sueldo neto');
    expect(parseCategory('')).toBeNull();
    expect(parseMonth('2026-11')).toBe('2026-11');
    expect(parseMonth('2026-13')).toBeNull();
    expect(parseDate('2026-02-31')).toBeNull();
    expect(parseDate('2026-11-09')).toBe('2026-11-09');
    expect(parseIcon('comida')).toBe('comida');
    expect(parseIcon('')).toBeUndefined();
    expect(parseIcon('otro')).toBeNull();
    expect(suggestedIcon('Comida rápida')).toBe('comida');
    expect(suggestedIcon('Freelance')).toBe('trabajo');
    expect(monthBounds('2026-11')).toEqual({
      start: '2026-11-01',
      end: '2026-12-01',
    });
  });
});