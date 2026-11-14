import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AuthenticationStorage,
  type RefreshTokenRecord,
  type RefreshTokenStore,
} from '@nestjs/authentication';
import { In, IsNull, LessThanOrEqual, Repository } from 'typeorm';
import { RefreshTokenRevocation } from './refresh-token-revocation.entity.js';
import { RefreshToken } from './refresh-token.entity.js';

@Injectable()
export class TypeOrmRefreshTokenStore implements RefreshTokenStore {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly tokens: Repository<RefreshToken>,
    @InjectRepository(RefreshTokenRevocation)
    private readonly revocations: Repository<RefreshTokenRevocation>,
    storage: AuthenticationStorage,
  ) {
    // Vitest keeps TypeORM uninitialized; the package's in-memory store covers e2e.
    if (process.env.VITEST !== 'true') {
      storage.registerSource({ refreshTokens: this });
    }
  }

  async getRefreshToken(id: string): Promise<RefreshTokenRecord | undefined> {
    const row = await this.tokens.findOne({ where: { id } });
    return row ? toRecord(row) : undefined;
  }

  async saveRefreshToken(record: RefreshTokenRecord): Promise<void> {
    await this.tokens.save({
      id: record.id,
      familyId: record.familyId,
      userId: record.userId,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      familyExpiresAt: record.familyExpiresAt,
      usedAt: record.usedAt ?? null,
      claims: record.claims ?? null,
    });
    await this.sweep(record.createdAt);
  }

  async markRefreshTokenUsed(id: string, at: Date): Promise<boolean> {
    const result = await this.tokens.update({ id, usedAt: IsNull() }, { usedAt: at });
    return (result.affected ?? 0) > 0;
  }

  async revokeRefreshTokenFamily(familyId: string): Promise<void> {
    await this.revocations
      .createQueryBuilder()
      .insert()
      .into(RefreshTokenRevocation)
      .values({ familyId, revokedAt: new Date() })
      .orIgnore()
      .execute();
  }

  async isRefreshTokenFamilyRevoked(familyId: string): Promise<boolean> {
    return this.revocations.exists({ where: { familyId } });
  }

  async revokeUserRefreshTokens(userId: string): Promise<void> {
    const families = await this.tokens
      .createQueryBuilder('token')
      .select('DISTINCT token.family_id', 'familyId')
      .where('token.user_id = :userId', { userId })
      .getRawMany<{ familyId: string }>();

    if (families.length === 0) {
      return;
    }

    await this.revocations
      .createQueryBuilder()
      .insert()
      .into(RefreshTokenRevocation)
      .values(families.map(({ familyId }) => ({ familyId, revokedAt: new Date() })))
      .orIgnore()
      .execute();
  }

  private async sweep(now: Date): Promise<void> {
    const expired = await this.tokens.find({
      where: { familyExpiresAt: LessThanOrEqual(now) },
      select: { familyId: true },
    });

    if (expired.length === 0) {
      return;
    }

    const familyIds = [...new Set(expired.map((row) => row.familyId))];
    await this.tokens.delete({ familyExpiresAt: LessThanOrEqual(now) });
    await this.revocations.delete({ familyId: In(familyIds) });
  }
}

function toRecord(row: RefreshToken): RefreshTokenRecord {
  return {
    id: row.id,
    familyId: row.familyId,
    userId: row.userId,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    familyExpiresAt: row.familyExpiresAt,
    ...(row.usedAt ? { usedAt: row.usedAt } : {}),
    ...(row.claims ? { claims: row.claims } : {}),
  };
}
