import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AppUser } from './app-user.js';
import { AccessPolicy } from './access.policy.js';
import { UsersService } from './users.service.js';

@ApiTags('usuarios')
@ApiBearerAuth()
@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('usuarios')
  @Can(AccessPolicy, 'readUsers')
  list() {
    return this.users.list();
  }

  @Post('usuarios')
  @HttpCode(201)
  @Can(AccessPolicy, 'manageUsers')
  create(@Body() body: { username?: unknown; password?: unknown; roles?: unknown }) {
    return this.users.create(body);
  }

  @Patch('usuarios/:id')
  @Can(AccessPolicy, 'manageUsers')
  setRoles(@Param('id') id: string, @Body() body: { roles?: unknown }) {
    return this.users.setRoles(id, body);
  }

  @Delete('usuarios/:id')
  @HttpCode(204)
  @Can(AccessPolicy, 'manageUsers')
  remove(@Param('id') id: string, @CurrentUser() actor: AppUser) {
    return this.users.remove(id, actor);
  }

  @Get('roles')
  @Can(AccessPolicy, 'readUsers')
  listRoles() {
    return this.users.listRoles();
  }

  @Get('permisos')
  @Can(AccessPolicy, 'readUsers')
  listPermissions() {
    return this.users.listPermissions();
  }
}
