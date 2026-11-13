import type { EntityManager, Repository } from 'typeorm';
import { TransactionType } from '../../src/finance/transaction-type.entity.js';
import { TransactionTypeRepository } from '../../src/finance/transaction-type.repository.js';

function repository() {
  const tipos = {
    upsert: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
  };
  const manager = {
    getRepository: vi.fn(() => ({ findOne: vi.fn(async () => ({ codigo: 'egreso' })) })),
  };
  return {
    tipos,
    manager,
    repository: new TransactionTypeRepository(tipos as unknown as Repository<TransactionType>),
  };
}

describe('TransactionTypeRepository', () => {
  it('seeds income and expense', async () => {
    const { repository: repo, tipos } = repository();

    await repo.seed();

    expect(tipos.upsert).toHaveBeenCalledWith(
      [
        { codigo: 'ingreso', nombre: 'Ingreso' },
        { codigo: 'egreso', nombre: 'Egreso' },
      ],
      ['codigo'],
    );
  });

  it('lists types by name', async () => {
    const { repository: repo, tipos } = repository();

    await repo.list();

    expect(tipos.find).toHaveBeenCalledWith({ order: { nombre: 'ASC' } });
  });

  it('finds a type on the default repository or inside a transaction', async () => {
    const { repository: repo, tipos, manager } = repository();

    await repo.findByCode('ingreso');
    await repo.findByCode('egreso', manager as unknown as EntityManager);

    expect(tipos.findOne).toHaveBeenCalledWith({ where: { codigo: 'ingreso' } });
    expect(manager.getRepository).toHaveBeenCalledWith(TransactionType);
  });
});
