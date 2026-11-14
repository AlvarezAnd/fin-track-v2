import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { DataSourceOptions } from 'typeorm';
import { InitialSchema1794481412883 } from './migrations/1794481412883-InitialSchema.js';
import { NumericIdsAndExchangeRates1794482600446 } from './migrations/1794482600446-NumericIdsAndExchangeRates.js';
import { RefreshTokens1794483001000 } from './migrations/1794483001000-RefreshTokens.js';

export const migrations = [
  InitialSchema1794481412883,
  NumericIdsAndExchangeRates1794482600446,
  RefreshTokens1794483001000,
];

export function databaseOptions(): DataSourceOptions {
  return {
    type: 'postgres',
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? 5432),
    username: process.env.DATABASE_USER ?? 'fintrack',
    password: process.env.DATABASE_PASSWORD ?? 'fintrack',
    database: process.env.DATABASE_NAME ?? 'fintrack',
  };
}

export function typeOrmConfig(): TypeOrmModuleOptions {
  return {
    ...databaseOptions(),
    autoLoadEntities: true,
    synchronize: false,
    migrations,
    migrationsRun: process.env.VITEST !== 'true',
    manualInitialization: process.env.VITEST === 'true',
  };
}
