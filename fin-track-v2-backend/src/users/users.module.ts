import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessPolicy } from './access.policy.js';
import { Permission } from './permission.entity.js';
import { PermissionsRepository } from './permissions.repository.js';
import { Role } from './role.entity.js';
import { RolesRepository } from './roles.repository.js';
import { User } from './user.entity.js';
import { UsersController } from './users.controller.js';
import { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Permission])],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
    RolesRepository,
    PermissionsRepository,
    AccessPolicy,
  ],
  exports: [UsersRepository, UsersService],
})
export class UsersModule {}
