import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
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
  private readonly logger = new Logger(UsersService.name);

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

  async remove(id: string, actor: { id: number }) {
    if (!this.dataSource.isInitialized) {
      throw new ServiceUnavailableException('La eliminación de usuarios no está disponible.');
    }

    const userId = parseEntityId(id);
    const user = userId ? await this.users.findById(userId) : null;

    if (!user) {
      throw new NotFoundException('El usuario no existe.');
    }

    if (user.id === actor.id) {
      throw new ConflictException('No podés eliminar tu propio usuario.');
    }

    if (user.username === adminUsername()) {
      throw new ConflictException('No se puede eliminar el administrador inicial.');
    }

    const movimientos = (await this.dataSource.query(
      `SELECT 1 AS ok FROM transacciones WHERE usuario_id = $1 LIMIT 1`,
      [user.id],
    )) as unknown[];
    const categorias = (await this.dataSource.query(
      `SELECT 1 AS ok FROM categorias WHERE usuario_id = $1 LIMIT 1`,
      [user.id],
    )) as unknown[];

    if (movimientos.length > 0 || categorias.length > 0) {
      throw new ConflictException(
        'No se puede eliminar un usuario con movimientos o categorías.',
      );
    }

    await this.users.remove(user);
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

  /**
   * The admin always exists after a start, never with a generic password. A strong
   * `ADMIN_PASSWORD` is used only when the user is created (or still has a generic
   * password); otherwise `DEFAULT_ADMIN_PASSWORD` is used.
   */
  private async ensureAdmin() {
    const username = adminUsername();

    if (!username) {
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
        passwordHash: await this.hasher.hash(this.initialAdminPassword()),
        roles: [adminRole],
      });
      return;
    }

    existing.username = username;

    if (await this.hasGenericPassword(existing.passwordHash)) {
      existing.passwordHash = await this.hasher.hash(this.initialAdminPassword());
    }

    if (!existing.roles.some((role) => role.code === 'admin')) {
      existing.roles = [...existing.roles, adminRole];
    }

    await this.users.save(existing);
  }

  private initialAdminPassword() {
    const configured = process.env.ADMIN_PASSWORD;

    if (configured && !isGenericPassword(configured)) {
      return configured;
    }

    if (configured) {
      this.logger.warn(
        'ADMIN_PASSWORD es genérica o demasiado corta: se usa la contraseña por defecto del administrador.',
      );
    }

    return DEFAULT_ADMIN_PASSWORD;
  }

  private async hasGenericPassword(hash: string) {
    const candidates = new Set(GENERIC_PASSWORDS);
    const configured = process.env.ADMIN_PASSWORD;

    if (configured && isGenericPassword(configured)) {
      candidates.add(configured);
    }

    for (const candidate of candidates) {
      try {
        if (await this.hasher.verify(candidate, hash)) {
          return true;
        }
      } catch {
        return true;
      }
    }

    return false;
  }
}

/** Default password of the admin when `ADMIN_PASSWORD` is unset or generic. */
export const DEFAULT_ADMIN_PASSWORD = 'iY2yRmHqpWRb';

const GENERIC_PASSWORDS = [
  'admin',
  'administrator',
  'password',
  'changeme',
  'secret',
  'root',
  '123456',
  '12345678',
];

function isGenericPassword(value: string) {
  return value.length < 8 || GENERIC_PASSWORDS.includes(value.toLowerCase());
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
