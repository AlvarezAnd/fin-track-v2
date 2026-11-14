import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { RefreshTokenRevocation } from '../auth/refresh-token-revocation.entity.js';
import { RefreshToken } from '../auth/refresh-token.entity.js';
import { Category } from '../finance/category.entity.js';
import { ExchangeRate } from '../finance/exchange-rate.entity.js';
import { Transaction } from '../finance/transaction.entity.js';
import { TransactionType } from '../finance/transaction-type.entity.js';
import { Permission } from '../users/permission.entity.js';
import { Role } from '../users/role.entity.js';
import { User } from '../users/user.entity.js';
import { databaseOptions, migrations } from './typeorm.config.js';

export const AppDataSource = new DataSource({
  ...databaseOptions(),
  entities: [
    TransactionType,
    Category,
    Transaction,
    ExchangeRate,
    Permission,
    Role,
    User,
    RefreshToken,
    RefreshTokenRevocation,
  ],
  migrations,
});
