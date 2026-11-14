import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module.js';
import {
  AuthController,
  AuthMeController,
  AuthPasswordController,
  AuthSignupController,
} from './auth.controller.js';
import { CredentialsService } from './credentials.service.js';
import { JwtAuth } from './jwt-auth.provider.js';
import { RefreshTokenRevocation } from './refresh-token-revocation.entity.js';
import { RefreshToken } from './refresh-token.entity.js';
import { TypeOrmRefreshTokenStore } from './typeorm-refresh-token.store.js';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([RefreshToken, RefreshTokenRevocation]),
  ],
  controllers: [AuthController, AuthSignupController, AuthPasswordController, AuthMeController],
  providers: [CredentialsService, JwtAuth, TypeOrmRefreshTokenStore],
})
export class AuthModule {}
