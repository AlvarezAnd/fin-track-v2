import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { CurrentUser, Public, TokenService } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AppUser } from '../users/app-user.js';
import { UsersService } from '../users/users.service.js';
import { CredentialsService } from './credentials.service.js';

type TokenBody = {
  username?: unknown;
  password?: unknown;
  refresh_token?: unknown;
};

function issuedTokens(tokens: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}) {
  return {
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expires_in: tokens.expiresIn,
  };
}

@ApiTags('auth')
@Public()
@Controller('auth/token')
export class AuthController {
  constructor(
    private readonly credentials: CredentialsService,
    private readonly tokens: TokenService,
  ) {}

  @Post()
  @HttpCode(200)
  async issue(@Body() body: TokenBody) {
    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
      throw new ServiceUnavailableException('El acceso no está configurado.');
    }

    const username = typeof body?.username === 'string' ? body.username.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const user = await this.credentials.verify(username, password);

    if (!user) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    }

    const tokens = await this.tokens.issue(String(user.id), {
      method: 'password',
      claims: { amr: ['pwd'] },
    });

    return issuedTokens(tokens);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() body: TokenBody) {
    const refreshToken =
      typeof body?.refresh_token === 'string' ? body.refresh_token : '';

    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    return issuedTokens(await this.tokens.refresh(refreshToken));
  }

  @Post('revoke')
  @HttpCode(204)
  async revoke(@Body() body: TokenBody) {
    const refreshToken =
      typeof body?.refresh_token === 'string' ? body.refresh_token : '';

    if (refreshToken) {
      await this.tokens.revoke(refreshToken);
    }
  }
}

@ApiTags('auth')
@Public()
@Controller('auth')
export class AuthSignupController {
  constructor(private readonly users: UsersService) {}

  @Post('signup')
  @HttpCode(201)
  signup(@Body() body: { username?: unknown; password?: unknown }) {
    return this.users.register(body);
  }
}

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthPasswordController {
  constructor(private readonly users: UsersService) {}

  @Patch('contrasena')
  @HttpCode(204)
  @Can.Anyone()
  changePassword(
    @CurrentUser() user: AppUser,
    @Body() body: { actual?: unknown; nueva?: unknown },
  ) {
    return this.users.changePassword(user.id, body);
  }
}

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthMeController {
  @Get('me')
  @Can.Anyone()
  me(@CurrentUser() user: AppUser) {
    return {
      username: user.username,
      roles: user.roles,
      permissions: user.permissions,
    };
  }
}
