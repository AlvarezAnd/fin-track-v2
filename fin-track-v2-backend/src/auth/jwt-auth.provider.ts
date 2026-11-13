import { Injectable } from '@nestjs/common';
import {
  AuthenticationRegistry,
  JwtBearerProvider,
  type JwtClaims,
} from '@nestjs/authentication';
import type { AppUser } from '../users/app-user.js';
import { CredentialsService } from './credentials.service.js';

@Injectable()
export class JwtAuth extends JwtBearerProvider<AppUser> {
  constructor(
    private readonly credentials: CredentialsService,
    registry: AuthenticationRegistry,
  ) {
    super({ realm: 'fin-track' });
    registry.registerProvider(this, { order: 0 });
  }

  protected validate({ sub }: JwtClaims) {
    return sub ? this.credentials.findById(sub) : null;
  }
}
