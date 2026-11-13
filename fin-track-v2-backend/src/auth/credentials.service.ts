import { timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import { DataSource } from 'typeorm';
import { parseEntityId } from '../database/entity-id.js';
import { PERMISSIONS, toAppUser, type AppUser } from '../users/app-user.js';
import { UsersRepository } from '../users/users.repository.js';

function sameValue(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function envAdmin(): AppUser {
  return {
    id: 1,
    username: process.env.ADMIN_USERNAME ?? '',
    roles: ['admin'],
    permissions: PERMISSIONS.map((permission) => permission.code),
  };
}

@Injectable()
export class CredentialsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly users: UsersRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async verify(username: string, password: string): Promise<AppUser | null> {
    if (this.dataSource.isInitialized) {
      const row = await this.users.findByUsername(username);
      const valid = await this.hasher.verify(password, row?.passwordHash);

      return valid && row ? toAppUser(row) : null;
    }

    const expectedUsername = process.env.ADMIN_USERNAME;
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedUsername || !expectedPassword) {
      return null;
    }

    const valid =
      sameValue(username, expectedUsername) &&
      sameValue(password, expectedPassword);

    return valid ? envAdmin() : null;
  }

  async findById(id: string): Promise<AppUser | null> {
    const numericId = parseEntityId(id);

    if (!numericId) {
      return null;
    }

    if (this.dataSource.isInitialized) {
      const row = await this.users.findById(numericId);
      return row ? toAppUser(row) : null;
    }

    if (numericId !== 1 || !process.env.ADMIN_USERNAME) {
      return null;
    }

    return envAdmin();
  }
}
