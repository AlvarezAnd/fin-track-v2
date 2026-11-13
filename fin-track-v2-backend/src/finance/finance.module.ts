import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryRepository } from './category.repository.js';
import { Category } from './category.entity.js';
import { ExchangeRateRepository } from './exchange-rate.repository.js';
import { ExchangeRate } from './exchange-rate.entity.js';
import { FinanceController } from './finance.controller.js';
import { FinanceService } from './finance.service.js';
import { TransactionTypeRepository } from './transaction-type.repository.js';
import { TransactionType } from './transaction-type.entity.js';
import { TransactionRepository } from './transaction.repository.js';
import { Transaction } from './transaction.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionType, Category, Transaction, ExchangeRate])],
  controllers: [FinanceController],
  providers: [
    FinanceService,
    TransactionTypeRepository,
    CategoryRepository,
    TransactionRepository,
    ExchangeRateRepository,
  ],
  exports: [CategoryRepository, TransactionRepository, ExchangeRateRepository],
})
export class FinanceModule {}
