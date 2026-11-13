import type { Repository } from 'typeorm';
import { User } from '../../src/users/user.entity.js';
import { UsersRepository } from '../../src/users/users.repository.js';

function repository() {
  const users = {
    findOne: vi.fn(),
    find: vi.fn(),
    save: vi.fn(async (value: User) => value),
    create: vi.fn((value: Partial<User>) => value),
  };

  return {
    users,
    repository: new UsersRepository(users as unknown as Repository<User>),
  };
}

describe('UsersRepository', () => {
  it('loads a user with roles and permissions', async () => {
    const { repository: repo, users } = repository();

    await repo.findById(1);
    await repo.findByUsername('ana');

    expect(users.findOne).toHaveBeenNthCalledWith(1, {
      where: { id: 1 },
      relations: { roles: { permissions: true } },
    });
    expect(users.findOne).toHaveBeenNthCalledWith(2, {
      where: { username: 'ana' },
      relations: { roles: { permissions: true } },
    });
  });

  it('lists users ordered by username', async () => {
    const { repository: repo, users } = repository();

    await repo.list();

    expect(users.find).toHaveBeenCalledWith({
      relations: { roles: true },
      order: { username: 'ASC' },
    });
  });

  it('saves a user and creates one from the given data', async () => {
    const { repository: repo, users } = repository();
    const existing = { id: 1, username: 'ana', passwordHash: 'hash', roles: [] } as User;
    const data = { username: 'luis', passwordHash: 'hash', roles: [] };

    await expect(repo.save(existing)).resolves.toBe(existing);
    await expect(repo.create(data)).resolves.toEqual(data);
    expect(users.create).toHaveBeenCalledWith(data);
    expect(users.save).toHaveBeenLastCalledWith(data);
  });
});
