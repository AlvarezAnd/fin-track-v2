import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type EntityManager, Repository } from 'typeorm';
import type { CodigoTipo } from './finance.validation.js';
import { TransactionType } from './transaction-type.entity.js';

@Injectable()
export class TransactionTypeRepository {
  constructor(
    @InjectRepository(TransactionType)
    private readonly tipos: Repository<TransactionType>,
  ) {}

  private repo(manager?: EntityManager) {
    return manager ? manager.getRepository(TransactionType) : this.tipos;
  }

  seed() {
    return this.tipos.upsert(
      [
        { codigo: 'ingreso', nombre: 'Ingreso' },
        { codigo: 'egreso', nombre: 'Egreso' },
      ],
      ['codigo'],
    );
  }

  list() {
    return this.tipos.find({ order: { nombre: 'ASC' } });
  }

  findByCode(codigo: CodigoTipo, manager?: EntityManager) {
    return this.repo(manager).findOne({ where: { codigo } });
  }
}
