import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import { DataSource } from 'typeorm';
import { parseEntityId } from '../database/entity-id.js';
import { presentUser } from './app-user.js';
import { PermissionsRepository } from './permissions.repository.js';
import { RolesRepository } from './roles.repository.js';
import { UsersRepository } from './users.repository.js';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    private readonly dataSource: DataSource,
    private readonly users: UsersRepository,
    private readonly roles: RolesRepository,
    private readonly permissions: PermissionsRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async onModuleInit() {
    if (!this.dataSource.isInitialized) {
      return;
    }

    await this.permissions.sync();
    await this.roles.sync(await this.permissions.findAll());
    await this.ensureAdmin();
  }

  async list() {
    const users = await this.users.list();
    return users.map(presentUser);
  }

  async listRoles() {
    const roles = await this.roles.list();

    return roles.map((role) => ({
      code: role.code,
      name: role.name,
      permissions: role.permissions.map((permission) => permission.code),
    }));
  }

  async listPermissions() {
    const permissions = await this.permissions.list();

    return permissions.map((permission) => ({
      code: permission.code,
      name: permission.name,
    }));
  }

  async register(body: { username?: unknown; password?: unknown }) {
    if (!this.dataSource.isInitialized) {
      throw new ServiceUnavailableException('El registro no está disponible.');
    }

    return this.create({ ...body, roles: ['user'] });
  }

  async create(body: { username?: unknown; password?: unknown; roles?: unknown }) {
    const username = parseUsername(body?.username);
    const password = parsePassword(body?.password);
    const roleCodes = parseRoles(body?.roles) ?? ['viewer'];

    if (!username) {
      throw new BadRequestException('Ingresá un usuario de hasta 64 caracteres.');
    }

    if (!password) {
      throw new BadRequestException('Ingresá una contraseña.');
    }

    const roles = await this.requireRoles(roleCodes);
    const existing = await this.users.findByUsername(username);

    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese nombre.');
    }

    const user = await this.users.create({
      username,
      passwordHash: await this.hasher.hash(password),
      roles,
    });

    return presentUser(user);
  }

  async changePassword(userId: number, body: { actual?: unknown; nueva?: unknown }) {
    if (!this.dataSource.isInitialized) {
      throw new ServiceUnavailableException('El cambio de contraseña no está disponible.');
    }

    const actual = parsePassword(body?.actual);
    const nueva = parsePassword(body?.nueva);

    if (!actual) {
      throw new BadRequestException('Ingresá la contraseña actual.');
    }

    if (!nueva) {
      throw new BadRequestException('Ingresá una contraseña.');
    }

    if (actual === nueva) {
      throw new BadRequestException('Elegí una contraseña distinta.');
    }

    const user = await this.users.findById(userId);

    if (!user) {
      throw new NotFoundException('El usuario no existe.');
    }

    const matches = await this.hasher.verify(actual, user.passwordHash);

    if (!matches) {
      throw new BadRequestException('La contraseña actual no es correcta.');
    }

    user.passwordHash = await this.hasher.hash(nueva);
    await this.users.save(user);
  }

  async setRoles(id: string, body: { roles?: unknown }) {
    const roleCodes = parseRoles(body?.roles);

    if (!roleCodes?.length) {
      throw new BadRequestException('Indicá al menos un rol.');
    }

    const userId = parseEntityId(id);
    const user = userId ? await this.users.findById(userId) : null;

    if (!user) {
      throw new NotFoundException('El usuario no existe.');
    }

    if (user.username === adminUsername() && !roleCodes.includes('admin')) {
      throw new ConflictException('El administrador inicial conserva el rol admin.');
    }

    user.roles = await this.requireRoles(roleCodes);
    return presentUser(await this.users.save(user));
  }

  private async requireRoles(codes: string[]) {
    if (!codes.length) {
      throw new BadRequestException('El rol no es válido.');
    }

    const roles = await this.roles.findByCodes(codes);

    if (roles.length !== codes.length) {
      throw new BadRequestException('El rol no es válido.');
    }

    return roles;
  }

  private async ensureAdmin() {
    const username = adminUsername();
    const password = process.env.ADMIN_PASSWORD;

    if (!username || !password) {
      return;
    }

    const adminRole = await this.roles.findByCode('admin');

    if (!adminRole) {
      return;
    }

    const existing = await this.users.findByUsername(username);

    if (!existing) {
      await this.users.create({
        username,
        passwordHash: await this.hasher.hash(password),
        roles: [adminRole],
      });
      return;
    }

    existing.username = username;
    let matches = false;

    try {
      matches = await this.hasher.verify(password, existing.passwordHash);
    } catch {
      matches = false;
    }

    if (!matches) {
      existing.passwordHash = await this.hasher.hash(password);
    }

    if (!existing.roles.some((role) => role.code === 'admin')) {
      existing.roles = [...existing.roles, adminRole];
    }

    await this.users.save(existing);
  }
}

function adminUsername() {
  const username = process.env.ADMIN_USERNAME?.trim();
  return username || null;
}

function parseUsername(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const username = value.trim();

  if (!username || username.length > 64) {
    return null;
  }

  return username;
}

function parsePassword(value: unknown) {
  if (typeof value !== 'string' || !value || value.length > 1024) {
    return null;
  }

  return value;
}

function parseRoles(value: unknown) {
  if (value == null) {
    return null;
  }

  if (!Array.isArray(value) || value.some((role) => typeof role !== 'string' || !role)) {
    return [];
  }

  return [...new Set(value)];
}
