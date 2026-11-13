import { amountInUsd } from '../../src/finance/money.js';

describe('amountInUsd', () => {
  it('keeps dollar amounts and converts with the stored rate', () => {
    expect(amountInUsd({ monto: 10, moneda: 'USD', cotizacion: 1 }, new Map())).toBe(10);
    expect(
      amountInUsd({ monto: 1550, moneda: 'ARS', cotizacion: 1550 }, new Map([['ARS', 1]])),
    ).toBe(1);
  });

  it('falls back to the current rate and skips a movement without one', () => {
    expect(amountInUsd({ monto: 2, moneda: 'EUR', cotizacion: null }, new Map([['EUR', 0.5]]))).toBe(4);
    expect(amountInUsd({ monto: 2, moneda: 'EUR', cotizacion: null }, new Map())).toBeNull();
  });
});
