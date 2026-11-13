import { Body, Controller, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { Can } from '@nestjs/authorization';
import { AccessPolicy } from './access.policy.js';
import { UsersService } from './users.service.js';

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
