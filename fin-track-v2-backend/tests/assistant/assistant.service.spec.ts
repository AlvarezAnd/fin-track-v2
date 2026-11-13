import { HttpException } from '@nestjs/common';
import type { CategoryRepository } from '../../src/finance/category.repository.js';
import type { ExchangeRateRepository } from '../../src/finance/exchange-rate.repository.js';
import type { TransactionRepository } from '../../src/finance/transaction.repository.js';
import { AssistantService } from '../../src/assistant/assistant.service.js';

function serviceWith() {
  const categorias = {
    listByUser: vi.fn().mockResolvedValue([
      { nombre: 'Comida', tipo: { codigo: 'egreso' } },
    ]),
  };
  const transacciones = { listForReport: vi.fn().mockResolvedValue([]) };
  const cotizaciones = { list: vi.fn().mockResolvedValue([]) };
  const service = new AssistantService(
    categorias as unknown as CategoryRepository,
    transacciones as unknown as TransactionRepository,
    cotizaciones as unknown as ExchangeRateRepository,
  );

  return { service, categorias, transacciones };
}

describe('AssistantService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('asks the provider again when it is rate limited', async () => {
    vi.stubEnv('LLM_API_KEY', 'test-key');
    vi.stubEnv('LLM_BASE_URL', 'https://llm.test/v1');
    vi.stubEnv('LLM_MODEL', 'test-model');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('busy', { status: 429 })),
    );
    const { service } = serviceWith();

    await expect(service.chat(7, [{ role: 'user', content: 'gastos' }])).rejects.toBeInstanceOf(HttpException);
    await expect(service.chat(7, [{ role: 'user', content: 'gastos' }])).rejects.toMatchObject({
      message: 'El asistente está ocupado, intenta en un minuto.',
    });
  });

  it('queries only the signed-in user and ignores an id sent by the model', async () => {
    vi.stubEnv('LLM_API_KEY', 'test-key');
    vi.stubEnv('LLM_BASE_URL', 'https://llm.test/v1');
    vi.stubEnv('LLM_MODEL', 'test-model');
    const replies = [
      {
        choices: [
          {
            message: {
              content: null,
              tool_calls: [
                {
                  id: 'call-1',
                  type: 'function',
                  function: {
                    name: 'reporte_movimientos',
                    arguments: JSON.stringify({ meses: 2, tipo: 'egreso', usuarioId: 99 }),
                  },
                },
              ],
            },
          },
        ],
      },
      { choices: [{ message: { content: 'En dos meses no hay egresos.' } }] },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json(replies.shift())),
    );
    const { service, transacciones } = serviceWith();

    await expect(service.chat(7, [{ role: 'user', content: 'gastos' }])).resolves.toEqual({
      respuesta: 'En dos meses no hay egresos.',
    });
    expect(transacciones.listForReport).toHaveBeenCalledWith(
      7,
      'egreso',
      expect.any(String),
      expect.any(String),
      [],
    );
  });
});
