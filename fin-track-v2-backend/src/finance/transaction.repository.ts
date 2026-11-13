import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  And,
  In,
  LessThan,
  LessThanOrEqual,
  MoreThanOrEqual,
  type EntityManager,
  type FindOptionsWhere,
  Repository,
} from 'typeorm';
import type { CodigoTipo } from './finance.validation.js';
import type { Category } from './category.entity.js';
import type { TransactionType } from './transaction-type.entity.js';
import { Transaction } from './transaction.entity.js';

@Injectable()
export class TransactionRepository {
  constructor(
    @InjectRepository(Transaction)
    private readonly transacciones: Repository<Transaction>,
  ) {}

  private repo(manager?: EntityManager) {
    return manager ? manager.getRepository(Transaction) : this.transacciones;
  }

  listForMonth(usuarioId: number, start: string, end: string) {
    return this.transacciones.find({
      where: {
        usuarioId,
        fecha: And(MoreThanOrEqual(start), LessThan(end)),
      },
      order: { fecha: 'DESC', creadoEn: 'DESC' },
    });
  }

  listInRange(usuarioId: number, start: string, end: string) {
    return this.transacciones.find({
      where: {
        usuarioId,
        fecha: And(MoreThanOrEqual(start), LessThanOrEqual(end)),
      },
      order: { fecha: 'DESC', creadoEn: 'DESC' },
    });
  }

  findById(usuarioId: number, id: number) {
    return this.transacciones.findOne({ where: { id, usuarioId } });
  }

  delete(usuarioId: number, id: number) {
    return this.transacciones.delete({ id, usuarioId });
  }

  countByCategory(usuarioId: number, categoriaId: number) {
    return this.transacciones
      .createQueryBuilder('movimiento')
      .where('movimiento.usuarioId = :usuarioId', { usuarioId })
      .andWhere('movimiento.categoria_id = :id', { id: categoriaId })
      .getCount();
  }

  listForReport(
    usuarioId: number,
    tipo: CodigoTipo,
    start: string,
    end: string,
    categorias: string[],
  ) {
    const where: FindOptionsWhere<Transaction> = {
      usuarioId,
      tipo: { codigo: tipo },
      fecha: And(MoreThanOrEqual(start), LessThan(end)),
    };

    if (categorias.length > 0) {
      where.categoria = { nombre: In(categorias) };
    }

    return this.transacciones.find({ where });
  }

  totals(usuarioId: number, start: string, end: string) {
    return this.transacciones
      .createQueryBuilder('movimiento')
      .innerJoin('movimiento.tipo', 'tipo')
      .select('tipo.codigo', 'codigo')
      .addSelect('COALESCE(SUM(movimiento.monto), 0)', 'total')
      .where('movimiento.usuarioId = :usuarioId', { usuarioId })
      .andWhere('movimiento.fecha >= :start', { start })
      .andWhere('movimiento.fecha < :end', { end })
      .groupBy('tipo.codigo')
      .getRawMany<{ codigo: CodigoTipo; total: string }>();
  }

  create(
    datos: {
      monto: number;
      fecha: string;
      usuarioId: number;
      moneda: string;
      cotizacion: number;
      categoria: Category;
      tipo: TransactionType;
    },
    manager: EntityManager,
  ) {
    return manager.save(manager.create(Transaction, datos));
  }

  save(movimiento: Transaction, manager: EntityManager) {
    return this.repo(manager).save(movimiento);
  }
}
