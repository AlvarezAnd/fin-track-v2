import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokenRevocation } from './refresh-token-revocation.entity.js';
import { RefreshToken } from './refresh-token.entity.js';
import { TypeOrmRefreshTokenStore } from './typeorm-refresh-token.store.js';

/**
 * Owns the Postgres RefreshTokenStore. Import it from
 * `AuthenticationModule.forRootAsync({ imports: [...] })` so Nest creates the
 * store while assembling authentication (before AuthenticationStorage locks).
 */
@Module({
  imports: [TypeOrmModule.forFeature([RefreshToken, RefreshTokenRevocation])],
  providers: [TypeOrmRefreshTokenStore],
  exports: [TypeOrmRefreshTokenStore, TypeOrmModule],
})
export class RefreshTokenStorageModule {}
