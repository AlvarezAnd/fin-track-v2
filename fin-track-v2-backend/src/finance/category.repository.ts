import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type EntityManager, Repository } from 'typeorm';
import { Category } from './category.entity.js';
import type { CodigoTipo } from './finance.validation.js';
import type { TransactionType } from './transaction-type.entity.js';

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectRepository(Category)
    private readonly categorias: Repository<Category>,
  ) {}

  private repo(manager?: EntityManager) {
    return manager ? manager.getRepository(Category) : this.categorias;
  }

  ensureUniqueIndex() {
    return this.categorias.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS categorias_usuario_tipo_nombre
      ON categorias (usuario_id, tipo_codigo, nombre_clave)
    `);
  }

  listByType(usuarioId: number, codigo: CodigoTipo) {
    return this.categorias.find({
      where: { usuarioId, tipo: { codigo } },
      order: { nombre: 'ASC' },
    });
  }

  listByUser(usuarioId: number) {
    return this.categorias.find({
      where: { usuarioId },
      order: { nombre: 'ASC' },
    });
  }

  listAll() {
    return this.categorias.find();
  }

  findById(usuarioId: number, id: number) {
    return this.categorias.findOne({ where: { id, usuarioId } });
  }

  findOtherByName(
    usuarioId: number,
    nombreClave: string,
    tipo: CodigoTipo,
    id: number,
  ) {
    return this.categorias
      .createQueryBuilder('categoria')
      .innerJoin('categoria.tipo', 'tipo')
      .where('categoria.usuarioId = :usuarioId', { usuarioId })
      .andWhere('categoria.nombreClave = :nombreClave', { nombreClave })
      .andWhere('tipo.codigo = :tipo', { tipo })
      .andWhere('categoria.id != :id', { id })
      .getOne();
  }

  findByKey(
    usuarioId: number,
    nombreClave: string,
    tipo: CodigoTipo,
    manager: EntityManager,
  ) {
    return manager
      .createQueryBuilder(Category, 'categoria')
      .innerJoinAndSelect('categoria.tipo', 'tipo')
      .where('categoria.usuarioId = :usuarioId', { usuarioId })
      .andWhere('categoria.nombreClave = :nombreClave', { nombreClave })
      .andWhere('tipo.codigo = :tipo', { tipo })
      .getOne();
  }

  create(
    datos: {
      nombre: string;
      nombreClave: string;
      usuarioId: number;
      tipo: TransactionType;
      icono: string;
    },
    manager?: EntityManager,
  ) {
    const repo = this.repo(manager);
    return repo.save(repo.create(datos));
  }

  save(categoria: Category, manager?: EntityManager) {
    return this.repo(manager).save(categoria);
  }

  delete(id: number, usuarioId: number) {
    return this.categorias.delete({ id, usuarioId });
  }
}
