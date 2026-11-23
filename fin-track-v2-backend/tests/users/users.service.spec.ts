import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { PasswordHasher } from '@nestjs/authentication';
import type { DataSource } from 'typeorm';
import type { PermissionsRepository } from '../../src/users/permissions.repository.js';
import type { Role } from '../../src/users/role.entity.js';
import type { RolesRepository } from '../../src/users/roles.repository.js';
import type { User } from '../../src/users/user.entity.js';
import type { UsersRepository } from '../../src/users/users.repository.js';
import { DEFAULT_ADMIN_PASSWORD, UsersService } from '../../src/users/users.service.js';

function role(code: string): Role {
  return { code, name: code, permissions: [] };
}

function user(partial: Partial<User> = {}): User {
  return {
    id: 1,
    username: 'ana',
    passwordHash: 'hash',
    roles: [role('viewer')],
    ...partial,
  };
}

function serviceWith(initialized = false) {
  const dataSource = {
    isInitialized: initialized,
    query: vi.fn(async () => []),
  };
  const users = {
    list: vi.fn(),
    findById: vi.fn(),
    findByUsername: vi.fn(),
    save: vi.fn(async (value: User) => value),
    create: vi.fn(async (value: User) => value),
    remove: vi.fn(async (value: User) => value),
  };
  const roles = {
    list: vi.fn(),
    findByCode: vi.fn(),
    findByCodes: vi.fn(),
    sync: vi.fn(),
  };
  const permissions = {
    list: vi.fn(),
    findAll: vi.fn().mockResolvedValue([]),
    sync: vi.fn(),
  };
  const hasher = {
    hash: vi.fn(async () => 'hashed'),
    verify: vi.fn(async () => true),
  };
  const service = new UsersService(
    dataSource as unknown as DataSource,
    users as unknown as UsersRepository,
    roles as unknown as RolesRepository,
    permissions as unknown as PermissionsRepository,
    hasher as unknown as PasswordHasher,
  );

  return { service, users, roles, permissions, hasher, dataSource };
}

describe('UsersService', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('skips setup when the database is not connected', async () => {
    const { service, permissions } = serviceWith();

    await service.onModuleInit();

    expect(permissions.sync).not.toHaveBeenCalled();
  });

  it('syncs access data and creates the initial admin with a strong ADMIN_PASSWORD', async () => {
    vi.stubEnv('ADMIN_USERNAME', 'admin');
    vi.stubEnv('ADMIN_PASSWORD', 'clave-segura-123');
    const adminRole = role('admin');
    const { service, users, roles, permissions, hasher } = serviceWith(true);
    permissions.findAll.mockResolvedValue([{ code: 'finance.read', name: 'Ver finanzas' }]);
    roles.findByCode.mockResolvedValue(adminRole);
    users.findByUsername.mockResolvedValue(null);

    await service.onModuleInit();

    expect(permissions.sync).toHaveBeenCalledOnce();
    expect(roles.sync).toHaveBeenCalledWith([{ code: 'finance.read', name: 'Ver finanzas' }]);
    expect(users.create).toHaveBeenCalledWith({
      username: 'admin',
      passwordHash: 'hashed',
      roles: [adminRole],
    });
    expect(hasher.hash).toHaveBeenCalledWith('clave-segura-123');
  });

  it.each([undefined, 'admin', 'corta'])(
    'creates the admin with the default password when ADMIN_PASSWORD is %s',
    async (configured) => {
      vi.stubEnv('ADMIN_USERNAME', 'admin');
      vi.stubEnv('ADMIN_PASSWORD', configured as string);
      const { service, users, roles, hasher } = serviceWith(true);
      roles.findByCode.mockResolvedValue(role('admin'));
      users.findByUsername.mockResolvedValue(null);

      await service.onModuleInit();

      expect(hasher.hash).toHaveBeenCalledWith(DEFAULT_ADMIN_PASSWORD);
      expect(users.create).toHaveBeenCalledOnce();
    },
  );

  it('keeps the password of an existing admin and adds the admin role', async () => {
    vi.stubEnv('ADMIN_USERNAME', 'root');
    vi.stubEnv('ADMIN_PASSWORD', 'clave-segura-123');
    const adminRole = role('admin');
    const existing = user({ id: 1, username: 'old', passwordHash: 'stored', roles: [role('viewer')] });
    const { service, users, roles, hasher } = serviceWith(true);
    roles.findByCode.mockResolvedValue(adminRole);
    users.findByUsername.mockResolvedValue(existing);
    hasher.verify.mockResolvedValue(false);

    await service.onModuleInit();

    expect(existing.username).toBe('root');
    expect(existing.passwordHash).toBe('stored');
    expect(hasher.hash).not.toHaveBeenCalled();
    expect(existing.roles.map((item) => item.code)).toEqual(['viewer', 'admin']);
    expect(users.save).toHaveBeenCalledWith(existing);
  });

  it('replaces an existing admin password that is still a generic one', async () => {
    vi.stubEnv('ADMIN_USERNAME', 'admin');
    vi.stubEnv('ADMIN_PASSWORD', 'admin');
    const existing = user({ id: 1, passwordHash: 'del-admin', roles: [role('admin')] });
    const { service, users, roles, hasher } = serviceWith(true);
    roles.findByCode.mockResolvedValue(role('admin'));
    users.findByUsername.mockResolvedValue(existing);
    hasher.verify.mockImplementation((async (plain: string) => plain === 'admin') as never);

    await service.onModuleInit();

    expect(hasher.hash).toHaveBeenCalledWith(DEFAULT_ADMIN_PASSWORD);
    expect(existing.passwordHash).toBe('hashed');
    expect(users.save).toHaveBeenCalledWith(existing);
  });

  it('does nothing when the admin username or role is missing', async () => {
    const { service, users, roles } = serviceWith(true);

    await service.onModuleInit();
    expect(users.findByUsername).not.toHaveBeenCalled();

    vi.stubEnv('ADMIN_USERNAME', 'admin');
    roles.findByCode.mockResolvedValue(null);
    await service.onModuleInit();
    expect(users.create).not.toHaveBeenCalled();
  });

  it('lists users, roles, and permissions', async () => {
    const { service, users, roles, permissions } = serviceWith();
    users.list.mockResolvedValue([user()]);
    roles.list.mockResolvedValue([
      { code: 'viewer', name: 'Consulta', permissions: [{ code: 'finance.read', name: 'Ver' }] },
    ]);
    permissions.list.mockResolvedValue([{ code: 'finance.read', name: 'Ver finanzas' }]);

    await expect(service.list()).resolves.toEqual([{ id: 1, username: 'ana', roles: ['viewer'] }]);
    await expect(service.listRoles()).resolves.toEqual([
      { code: 'viewer', name: 'Consulta', permissions: ['finance.read'] },
    ]);
    await expect(service.listPermissions()).resolves.toEqual([
      { code: 'finance.read', name: 'Ver finanzas' },
    ]);
  });

  it('registers a public account as a common user', async () => {
    const common = role('user');
    const { service, users, roles } = serviceWith(true);
    roles.findByCodes.mockResolvedValue([common]);
    users.findByUsername.mockResolvedValue(null);
    users.create.mockImplementation(async (data) => data);

    await expect(service.register({ username: 'visita', password: 'clave' })).resolves.toMatchObject({
      username: 'visita',
      roles: ['user'],
    });
    expect(roles.findByCodes).toHaveBeenCalledWith(['user']);
  });

  it('refuses public registration when the database is disconnected', async () => {
    const { service } = serviceWith(false);

    await expect(service.register({ username: 'visita', password: 'clave' })).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('replaces the signed-in user password', async () => {
    const { service, users, hasher } = serviceWith(true);
    const existing = user({ id: 4, passwordHash: 'hash' });
    users.findById.mockResolvedValue(existing);

    await service.changePassword(4, { actual: 'vieja', nueva: 'nueva' });

    expect(hasher.verify).toHaveBeenCalledWith('vieja', 'hash');
    expect(hasher.hash).toHaveBeenCalledWith('nueva');
    expect(existing.passwordHash).toBe('hashed');
    expect(users.save).toHaveBeenCalledWith(existing);
  });

  it('rejects a wrong current password, the same new password, and a disconnected database', async () => {
    const { service, users, hasher } = serviceWith(true);
    users.findById.mockResolvedValue(user());
    hasher.verify.mockResolvedValue(false);

    await expect(service.changePassword(1, { actual: 'no', nueva: 'otra' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.changePassword(1, { actual: 'misma', nueva: 'misma' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(users.save).not.toHaveBeenCalled();

    const offline = serviceWith(false);
    await expect(
      offline.service.changePassword(1, { actual: 'vieja', nueva: 'nueva' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('creates a user with the viewer role by default', async () => {
    const viewer = role('viewer');
    const { service, users, roles, hasher } = serviceWith();
    roles.findByCodes.mockResolvedValue([viewer]);
    users.findByUsername.mockResolvedValue(null);
    users.create.mockImplementation(async (data) => data);

    await expect(service.create({ username: '  Ana  ', password: 'clave' })).resolves.toMatchObject({
      username: 'Ana',
      roles: ['viewer'],
    });
    expect(hasher.hash).toHaveBeenCalledWith('clave');
    expect(roles.findByCodes).toHaveBeenCalledWith(['viewer']);
  });

  it('rejects an invalid user, a duplicate name, and an unknown role', async () => {
    const { service, users, roles } = serviceWith();

    await expect(service.create({ username: ' ', password: 'clave' })).rejects.toThrow(
      'Ingresá un usuario de hasta 64 caracteres.',
    );
    await expect(service.create({ username: 'ana', password: '' })).rejects.toThrow('Ingresá una contraseña.');
    await expect(service.create({ username: 'ana', password: 'clave', roles: [''] })).rejects.toThrow(
      'El rol no es válido.',
    );

    roles.findByCodes.mockResolvedValue([]);
    await expect(service.create({ username: 'ana', password: 'clave', roles: ['editor'] })).rejects.toBeInstanceOf(
      BadRequestException,
    );

    roles.findByCodes.mockResolvedValue([role('viewer')]);
    users.findByUsername.mockResolvedValue(user());
    await expect(service.create({ username: 'ana', password: 'clave' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('replaces the roles of a user', async () => {
    const existing = user();
    const { service, users, roles } = serviceWith();
    users.findById.mockResolvedValue(existing);
    roles.findByCodes.mockResolvedValue([role('admin')]);

    await expect(service.setRoles('1', { roles: ['admin', 'admin'] })).resolves.toEqual({
      id: 1,
      username: 'ana',
      roles: ['admin'],
    });
    expect(roles.findByCodes).toHaveBeenCalledWith(['admin']);
    expect(users.save).toHaveBeenCalledWith(existing);
  });

  it('protects the initial admin and rejects an empty or missing user', async () => {
    const { service, users } = serviceWith();

    await expect(service.setRoles('1', { roles: [] })).rejects.toThrow('Indicá al menos un rol.');
    vi.stubEnv('ADMIN_USERNAME', 'ana');
    users.findById.mockResolvedValue(user());
    await expect(service.setRoles('1', { roles: ['viewer'] })).rejects.toBeInstanceOf(ConflictException);
    users.findById.mockResolvedValue(null);
    await expect(service.setRoles('missing', { roles: ['viewer'] })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('removes a user without finance data', async () => {
    const existing = user({ id: 3, username: 'visita' });
    const { service, users, dataSource } = serviceWith(true);
    users.findById.mockResolvedValue(existing);

    await service.remove('3', { id: 1 });

    expect(dataSource.query).toHaveBeenCalledTimes(2);
    expect(users.remove).toHaveBeenCalledWith(existing);
  });

  it('refuses to remove yourself, the bootstrap admin, or a user with data', async () => {
    const { service, users, dataSource } = serviceWith(true);
    const existing = user({ id: 2, username: 'visita' });
    users.findById.mockResolvedValue(existing);

    await expect(service.remove('2', { id: 2 })).rejects.toBeInstanceOf(ConflictException);

    vi.stubEnv('ADMIN_USERNAME', 'visita');
    await expect(service.remove('2', { id: 1 })).rejects.toBeInstanceOf(ConflictException);

    vi.unstubAllEnvs();
    dataSource.query.mockResolvedValueOnce([{ ok: 1 }]);
    await expect(service.remove('2', { id: 1 })).rejects.toBeInstanceOf(ConflictException);
    expect(users.remove).not.toHaveBeenCalled();

    users.findById.mockResolvedValue(null);
    await expect(service.remove('9', { id: 1 })).rejects.toBeInstanceOf(NotFoundException);

    const offline = serviceWith(false);
    await expect(offline.service.remove('2', { id: 1 })).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
