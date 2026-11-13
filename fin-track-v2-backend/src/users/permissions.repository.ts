import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PERMISSIONS } from './app-user.js';
import { Permission } from './permission.entity.js';

@Injectable()
export class PermissionsRepository {
  constructor(
    @InjectRepository(Permission)
    private readonly permissions: Repository<Permission>,
  ) {}

  list() {
    return this.permissions.find({ order: { code: 'ASC' } });
  }

  findAll() {
    return this.permissions.find();
  }

  sync() {
    return this.permissions.upsert(
      PERMISSIONS.map((permission) => ({
        code: permission.code,
        name: permission.name,
      })),
      ['code'],
    );
  }
}
