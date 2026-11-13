import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ROLES } from './app-user.js';
import { Permission } from './permission.entity.js';
import { Role } from './role.entity.js';

@Injectable()
export class RolesRepository {
  constructor(
    @InjectRepository(Role)
    private readonly roles: Repository<Role>,
  ) {}

  list() {
    return this.roles.find({
      relations: { permissions: true },
      order: { code: 'ASC' },
    });
  }

  findByCode(code: string) {
    return this.roles.findOne({
      where: { code },
      relations: { permissions: true },
    });
  }

  findByCodes(codes: string[]) {
    return this.roles.find({
      where: { code: In(codes) },
      relations: { permissions: true },
    });
  }

  async sync(permissions: Permission[]) {
    for (const role of ROLES) {
      const allowed = new Set<string>(role.permissions);
      const current = await this.findByCode(role.code);
      const entity = current ?? this.roles.create({ code: role.code });
      entity.name = role.name;
      entity.permissions = permissions.filter((permission) => allowed.has(permission.code));
      await this.roles.save(entity);
    }
  }
}
