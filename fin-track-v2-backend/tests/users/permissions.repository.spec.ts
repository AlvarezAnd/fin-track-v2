import type { Repository } from 'typeorm';
import { PERMISSIONS } from '../../src/users/app-user.js';
import { Permission } from '../../src/users/permission.entity.js';
import { PermissionsRepository } from '../../src/users/permissions.repository.js';

function repository() {
  const permissions = {
    find: vi.fn(),
    upsert: vi.fn(),
  };

  return {
    permissions,
    repository: new PermissionsRepository(permissions as unknown as Repository<Permission>),
  };
}

describe('PermissionsRepository', () => {
  it('lists permissions ordered by code', async () => {
    const { repository: repo, permissions } = repository();

    await repo.list();

    expect(permissions.find).toHaveBeenCalledWith({ order: { code: 'ASC' } });
  });

  it('returns every permission without an order', async () => {
    const { repository: repo, permissions } = repository();

    await repo.findAll();

    expect(permissions.find).toHaveBeenCalledWith();
  });

  it('upserts the application permissions', async () => {
    const { repository: repo, permissions } = repository();

    await repo.sync();

    expect(permissions.upsert).toHaveBeenCalledWith(
      PERMISSIONS.map((permission) => ({ code: permission.code, name: permission.name })),
      ['code'],
    );
  });
});
