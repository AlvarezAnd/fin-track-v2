import type { EntityManager, Repository } from 'typeorm';
import { Transaction } from '../../src/finance/transaction.entity.js';
import { TransactionRepository } from '../../src/finance/transaction.repository.js';

function query(result: unknown = []) {
  const builder = {
    innerJoin: vi.fn(),
    leftJoinAndSelect: vi.fn(),
    select: vi.fn(),
    addSelect: vi.fn(),
    where: vi.fn(),
    andWhere: vi.fn(),
    orderBy: vi.fn(),
    addOrderBy: vi.fn(),
    groupBy: vi.fn(),
    getCount: vi.fn(async () => result),
    getRawMany: vi.fn(async () => result),
    getMany: vi.fn(async () => (Array.isArray(result) ? result : [])),
  };
  builder.innerJoin.mockReturnValue(builder);
  builder.leftJoinAndSelect.mockReturnValue(builder);
  builder.select.mockReturnValue(builder);
  builder.addSelect.mockReturnValue(builder);
  builder.where.mockReturnValue(builder);
  builder.andWhere.mockReturnValue(builder);
  builder.orderBy.mockReturnValue(builder);
  builder.addOrderBy.mockReturnValue(builder);
  builder.groupBy.mockReturnValue(builder);
  return builder;
}

function repository() {
  const transacciones = {
    find: vi.fn(),
    findOne: vi.fn(),
    delete: vi.fn(),
    createQueryBuilder: vi.fn(),
    save: vi.fn(),
  };
  return {
    transacciones,
    repository: new TransactionRepository(transacciones as unknown as Repository<Transaction>),
  };
}

describe('TransactionRepository', () => {
  it('lists a month with the end date excluded by fecha', async () => {
    const builder = query([]);
    const { repository: repo, transacciones } = repository();
    transacciones.createQueryBuilder.mockReturnValue(builder);

    await repo.listForMonth(1, '2026-11-01', '2026-12-01');

    expect(builder.where).toHaveBeenCalledWith('movimiento.usuarioId = :usuarioId', { usuarioId: 1 });
    expect(builder.andWhere).toHaveBeenCalledWith('movimiento.fecha >= :start', { start: '2026-11-01' });
    expect(builder.andWhere).toHaveBeenCalledWith('movimiento.fecha < :end', { end: '2026-12-01' });
    expect(builder.orderBy).toHaveBeenCalledWith('movimiento.fecha', 'DESC');
    expect(builder.addOrderBy).toHaveBeenCalledWith('movimiento.creadoEn', 'DESC');
  });

  it('lists a closed date range by fecha', async () => {
    const builder = query([]);
    const { repository: repo, transacciones } = repository();
    transacciones.createQueryBuilder.mockReturnValue(builder);

    await repo.listInRange(1, '2026-11-01', '2026-11-10');

    expect(builder.andWhere).toHaveBeenCalledWith('movimiento.fecha >= :start', { start: '2026-11-01' });
    expect(builder.andWhere).toHaveBeenCalledWith('movimiento.fecha <= :end', { end: '2026-11-10' });
  });

  it('finds and deletes by user and id', async () => {
    const { repository: repo, transacciones } = repository();

    await repo.findById(1, 1);
    await repo.delete(1, 1);

    expect(transacciones.findOne).toHaveBeenCalledWith({ where: { id: 1, usuarioId: 1 } });
    expect(transacciones.delete).toHaveBeenCalledWith({ id: 1, usuarioId: 1 });
  });

  it('counts movements of a category', async () => {
    const builder = query(3);
    const { repository: repo, transacciones } = repository();
    transacciones.createQueryBuilder.mockReturnValue(builder);

    await expect(repo.countByCategory(1, 1)).resolves.toBe(3);
    expect(builder.where).toHaveBeenCalledWith('movimiento.usuarioId = :usuarioId', { usuarioId: 1 });
    expect(builder.andWhere).toHaveBeenCalledWith('movimiento.categoria_id = :id', { id: 1 });
  });

  it('sums amounts by transaction type', async () => {
    const rows = [{ codigo: 'ingreso', total: '10.00' }];
    const builder = query(rows);
    const { repository: repo, transacciones } = repository();
    transacciones.createQueryBuilder.mockReturnValue(builder);

    await expect(repo.totals(1, '2026-11-01', '2026-12-01')).resolves.toEqual(rows);
    expect(builder.andWhere).toHaveBeenCalledWith('movimiento.fecha >= :start', { start: '2026-11-01' });
    expect(builder.andWhere).toHaveBeenCalledWith('movimiento.fecha < :end', { end: '2026-12-01' });
    expect(builder.groupBy).toHaveBeenCalledWith('tipo.codigo');
  });

  it('creates and saves through the transaction manager', async () => {
    const created = { id: 1 };
    const saved = vi.fn(async (value: unknown) => value);
    const manager = {
      create: vi.fn((_entity: unknown, datos: unknown) => datos),
      save: vi.fn(async (value: unknown) => value),
      getRepository: vi.fn(() => ({ save: saved })),
    };
    const { repository: repo } = repository();
    const datos = {
      id: 1,
      monto: 10,
      fecha: '2026-11-09',
      usuarioId: 1,
      categoria: { id: 1 },
      tipo: { codigo: 'ingreso' },
    };

    await expect(repo.create(datos as never, manager as unknown as EntityManager)).resolves.toEqual(datos);
    expect(manager.create).toHaveBeenCalledWith(Transaction, datos);
    expect(manager.save).toHaveBeenCalledWith(datos);

    await repo.save(created as never, manager as unknown as EntityManager);
    expect(manager.getRepository).toHaveBeenCalledWith(Transaction);
    expect(saved).toHaveBeenCalledWith(created);
  });
});
