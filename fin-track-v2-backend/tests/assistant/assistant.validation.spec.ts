import { parseReportArgs, recentMessages } from '../../src/assistant/assistant.validation.js';

const available = [
  { nombre: 'Comida', tipo: 'egreso' as const },
  { nombre: 'Sueldo', tipo: 'ingreso' as const },
];

describe('parseReportArgs', () => {
  it('defaults the type and grouping, and accepts the user categories', () => {
    expect(parseReportArgs({ meses: 3, categorias: ['Comida'] }, available)).toEqual({
      ok: true,
      args: { tipo: 'egreso', categorias: ['Comida'], meses: 3, agruparPor: 'categoria' },
    });
  });

  it('rejects a broken range, an unknown category, and a category of another type', () => {
    expect(parseReportArgs({ meses: 25 }, available).ok).toBe(false);
    expect(parseReportArgs({ meses: 1.5 }, available).ok).toBe(false);

    const unknown = parseReportArgs({ meses: 1, categorias: ['Viajes'] }, available);
    expect(unknown).toMatchObject({
      ok: false,
      categorias_disponibles: ['Comida'],
    });

    const otherType = parseReportArgs({ meses: 1, tipo: 'egreso', categorias: ['Sueldo'] }, available);
    expect(otherType.ok).toBe(false);
  });
});

describe('recentMessages', () => {
  it('keeps the last eight user and assistant texts', () => {
    const history = Array.from({ length: 10 }, (_, index) => ({
      role: index % 2 === 0 ? 'user' : 'assistant',
      content: `m${index}`,
    }));

    const messages = recentMessages([
      ...history,
      { role: 'tool', content: 'no' },
      { role: 'user', content: '  hola  ' },
    ]);

    expect(messages).toHaveLength(8);
    expect(messages[0]?.content).toBe('m3');
    expect(messages.at(-1)).toEqual({ role: 'user', content: 'hola' });
  });
});
