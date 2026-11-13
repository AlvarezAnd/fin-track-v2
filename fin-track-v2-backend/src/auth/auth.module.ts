import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import {
  AuthController,
  AuthMeController,
  AuthPasswordController,
  AuthSignupController,
} from './auth.controller.js';
import { CredentialsService } from './credentials.service.js';
import { JwtAuth } from './jwt-auth.provider.js';

@Module({
  imports: [UsersModule],
  controllers: [AuthController, AuthSignupController, AuthPasswordController, AuthMeController],
  providers: [CredentialsService, JwtAuth],
})
export class AuthModule {}
