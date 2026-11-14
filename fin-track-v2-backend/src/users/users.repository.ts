import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity.js';
import { User } from './user.entity.js';

const withPermissions = { roles: { permissions: true } } as const;

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  findById(id: number) {
    return this.users.findOne({ where: { id }, relations: withPermissions });
  }

  findByUsername(username: string) {
    return this.users.findOne({ where: { username }, relations: withPermissions });
  }

  list() {
    return this.users.find({
      relations: { roles: true },
      order: { username: 'ASC' },
    });
  }

  save(user: User) {
    return this.users.save(user);
  }

  create(data: {
    username: string;
    passwordHash: string;
    roles: Role[];
  }) {
    return this.users.save(this.users.create(data));
  }

  remove(user: User) {
    return this.users.remove(user);
  }
}
