import type { PasswordHasher } from '@nestjs/authentication';
import type { DataSource } from 'typeorm';
import { PERMISSIONS } from '../../src/users/app-user.js';
import type { User } from '../../src/users/user.entity.js';
import type { UsersRepository } from '../../src/users/users.repository.js';
import { CredentialsService } from '../../src/auth/credentials.service.js';

function user(partial: Partial<User> = {}): User {
  return {
    id: 1,
    username: 'ana',
    passwordHash: 'hash',
    roles: [
      {
        code: 'viewer',
        name: 'Consulta',
        permissions: [{ code: 'finance.read', name: 'Ver finanzas' }],
      },
    ],
    ...partial,
  };
}

function serviceWith(initialized: boolean) {
  const dataSource = { isInitialized: initialized };
  const users = {
    findByUsername: vi.fn(),
    findById: vi.fn(),
  };
  const hasher = {
    hash: vi.fn(),
    verify: vi.fn(async () => false),
  };
  const service = new CredentialsService(
    dataSource as unknown as DataSource,
    users as unknown as UsersRepository,
    hasher as unknown as PasswordHasher,
  );

  return { service, users, hasher };
}

describe('CredentialsService', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('accepts a stored user when the password matches', async () => {
    const row = user();
    const { service, users, hasher } = serviceWith(true);
    users.findByUsername.mockResolvedValue(row);
    hasher.verify.mockResolvedValue(true);

    await expect(service.verify('ana', 'clave')).resolves.toEqual({
      id: 1,
      username: 'ana',
      roles: ['viewer'],
      permissions: ['finance.read'],
    });
    expect(hasher.verify).toHaveBeenCalledWith('clave', 'hash');
  });

  it('rejects a stored user when the password or the account is missing', async () => {
    const { service, users, hasher } = serviceWith(true);
    users.findByUsername.mockResolvedValue(user());

    await expect(service.verify('ana', 'otra')).resolves.toBeNull();

    users.findByUsername.mockResolvedValue(null);
    await expect(service.verify('ana', 'clave')).resolves.toBeNull();
    expect(hasher.verify).toHaveBeenLastCalledWith('clave', undefined);
  });

  it('compares the environment admin when the database is not connected', async () => {
    vi.stubEnv('ADMIN_USERNAME', 'admin');
    vi.stubEnv('ADMIN_PASSWORD', 'secret');
    const { service, users } = serviceWith(false);

    await expect(service.verify('admin', 'secret')).resolves.toEqual({
      id: 1,
      username: 'admin',
      roles: ['admin'],
      permissions: PERMISSIONS.map((permission) => permission.code),
    });
    await expect(service.verify('admin', 'secreX')).resolves.toBeNull();
    await expect(service.verify('a', 'secret')).resolves.toBeNull();
    expect(users.findByUsername).not.toHaveBeenCalled();
  });

  it('rejects the environment admin when credentials are not configured', async () => {
    const { service } = serviceWith(false);

    await expect(service.verify('admin', 'secret')).resolves.toBeNull();
  });

  it('finds a stored user by id', async () => {
    const { service, users } = serviceWith(true);
    users.findById.mockResolvedValueOnce(user()).mockResolvedValueOnce(null);

    await expect(service.findById('1')).resolves.toMatchObject({ username: 'ana' });
    await expect(service.findById('missing')).resolves.toBeNull();
  });

  it('returns the environment admin only for the reserved id', async () => {
    vi.stubEnv('ADMIN_USERNAME', 'admin');
    const { service } = serviceWith(false);

    await expect(service.findById('1')).resolves.toMatchObject({ id: 1, username: 'admin' });
    await expect(service.findById('2')).resolves.toBeNull();

    vi.stubEnv('ADMIN_USERNAME', '');
    await expect(service.findById('1')).resolves.toBeNull();
  });
});
