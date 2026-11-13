import type { EntityManager, Repository } from 'typeorm';
import { Category } from '../../src/finance/category.entity.js';
import { CategoryRepository } from '../../src/finance/category.repository.js';

function query(result: unknown = null) {
  const builder = {
    innerJoin: vi.fn(),
    innerJoinAndSelect: vi.fn(),
    where: vi.fn(),
    andWhere: vi.fn(),
    getOne: vi.fn(async () => result),
  };
  builder.innerJoin.mockReturnValue(builder);
  builder.innerJoinAndSelect.mockReturnValue(builder);
  builder.where.mockReturnValue(builder);
  builder.andWhere.mockReturnValue(builder);
  return builder;
}

function repository() {
  const categorias = {
    query: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    createQueryBuilder: vi.fn(),
    save: vi.fn(async (value: Category) => value),
    delete: vi.fn(),
  };
  return {
    categorias,
    repository: new CategoryRepository(categorias as unknown as Repository<Category>),
  };
}

describe('CategoryRepository', () => {
  it('creates the unique name index', async () => {
    const { repository: repo, categorias } = repository();

    await repo.ensureUniqueIndex();

    expect(categorias.query).toHaveBeenCalledWith(expect.stringContaining('categorias_usuario_tipo_nombre'));
  });

  it('lists categories by type, by user, and all of them', async () => {
    const { repository: repo, categorias } = repository();

    await repo.listByType(1, 'egreso');
    await repo.listByUser(1);
    await repo.listAll();

    expect(categorias.find).toHaveBeenNthCalledWith(1, {
      where: { usuarioId: 1, tipo: { codigo: 'egreso' } },
      order: { nombre: 'ASC' },
    });
    expect(categorias.find).toHaveBeenNthCalledWith(2, {
      where: { usuarioId: 1 },
      order: { nombre: 'ASC' },
    });
    expect(categorias.find).toHaveBeenNthCalledWith(3);
  });

  it('finds one category of a user and deletes it', async () => {
    const { repository: repo, categorias } = repository();

    await repo.findById(1, 1);
    await repo.delete(1, 1);

    expect(categorias.findOne).toHaveBeenCalledWith({ where: { id: 1, usuarioId: 1 } });
    expect(categorias.delete).toHaveBeenCalledWith({ id: 1, usuarioId: 1 });
  });

  it('looks for another category with the same name', async () => {
    const builder = query({ id: 2 });
    const { repository: repo, categorias } = repository();
    categorias.createQueryBuilder.mockReturnValue(builder);

    await expect(repo.findOtherByName(1, 'sueldo', 'ingreso', 1)).resolves.toEqual({
      id: 2,
    });
    expect(builder.andWhere).toHaveBeenCalledWith('categoria.nombreClave = :nombreClave', {
      nombreClave: 'sueldo',
    });
    expect(builder.andWhere).toHaveBeenCalledWith('tipo.codigo = :tipo', { tipo: 'ingreso' });
    expect(builder.andWhere).toHaveBeenCalledWith('categoria.id != :id', { id: 1 });
  });

  it('finds, creates, and saves a category inside a transaction', async () => {
    const builder = query({ id: 1 });
    const manager = {
      createQueryBuilder: vi.fn(() => builder),
      create: vi.fn((_entity, datos) => datos),
      save: vi.fn(async (value) => value),
      getRepository: vi.fn(() => ({ save: vi.fn(async (value) => ({ ...value, saved: true })) })),
    };
    const { repository: repo, categorias } = repository();
    const datos = {
      nombre: 'Sueldo',
      nombreClave: 'sueldo',
      usuarioId: 1,
      tipo: { codigo: 'ingreso' as const, nombre: 'Ingreso' },
      icono: 'trabajo',
    };

    await expect(
      repo.findByKey(1, 'sueldo', 'ingreso', manager as unknown as EntityManager),
    ).resolves.toEqual({ id: 1 });
    expect(manager.createQueryBuilder).toHaveBeenCalledWith(Category, 'categoria');

    await expect(repo.create(datos, manager as unknown as EntityManager)).resolves.toEqual(datos);
    expect(manager.create).toHaveBeenCalledWith(Category, datos);

    const row = { id: 1 } as unknown as Category;
    await expect(repo.save(row)).resolves.toBe(row);
    expect(categorias.save).toHaveBeenCalledWith(row);

    await expect(repo.save(row, manager as unknown as EntityManager)).resolves.toMatchObject({
      saved: true,
    });
    expect(manager.getRepository).toHaveBeenCalledWith(Category);
  });
});
