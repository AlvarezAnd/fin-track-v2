import type { Repository } from 'typeorm';
import { PERMISSIONS } from '../../src/users/app-user.js';
import { Role } from '../../src/users/role.entity.js';
import { RolesRepository } from '../../src/users/roles.repository.js';

function repository() {
  const roles = {
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn((value: Partial<Role>) => ({ permissions: [], ...value }) as Role),
    save: vi.fn(async (value: Role) => value),
  };

  return {
    roles,
    repository: new RolesRepository(roles as unknown as Repository<Role>),
  };
}

describe('RolesRepository', () => {
  it('lists roles with their permissions', async () => {
    const { repository: repo, roles } = repository();

    await repo.list();

    expect(roles.find).toHaveBeenCalledWith({
      relations: { permissions: true },
      order: { code: 'ASC' },
    });
  });

  it('finds one role and several roles by code', async () => {
    const { repository: repo, roles } = repository();

    await repo.findByCode('admin');
    await repo.findByCodes(['admin', 'viewer']);

    expect(roles.findOne).toHaveBeenCalledWith({
      where: { code: 'admin' },
      relations: { permissions: true },
    });
    const where = roles.find.mock.calls[0][0].where;
    expect(where.code.type).toBe('in');
    expect(where.code.value).toEqual(['admin', 'viewer']);
  });

  it('creates a missing role and updates an existing one', async () => {
    const { repository: repo, roles } = repository();
    const viewer = { code: 'viewer', name: 'Anterior', permissions: [] } as Role;
    roles.findOne.mockImplementation(async (options: { where: { code: string } }) =>
      options.where.code === 'viewer' ? viewer : null,
    );

    await repo.sync([...PERMISSIONS]);

    const saved = roles.save.mock.calls.map((call) => call[0] as Role);
    expect(saved.map((item) => item.code)).toEqual(['admin', 'viewer', 'user']);
    expect(saved[0].name).toBe('Administrador');
    expect(saved[0].permissions.map((item) => item.code)).toEqual([
      'finance.read',
      'finance.write',
      'users.read',
      'users.manage',
    ]);
    expect(saved[1]).toBe(viewer);
    expect(viewer.name).toBe('Consulta');
    expect(viewer.permissions.map((item) => item.code)).toEqual(['finance.read']);
    expect(saved[2].name).toBe('Usuario común');
    expect(saved[2].permissions.map((item) => item.code)).toEqual([
      'finance.read',
      'finance.write',
      'users.read',
    ]);
    expect(roles.create).toHaveBeenCalledWith({ code: 'admin' });
    expect(roles.create).toHaveBeenCalledWith({ code: 'user' });
  });
});
