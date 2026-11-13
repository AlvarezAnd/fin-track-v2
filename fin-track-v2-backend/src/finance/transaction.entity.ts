import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Category } from './category.entity.js';
import { TransactionType } from './transaction-type.entity.js';

const money = {
  to: (value: number) => value,
  from: (value: string | number) => Number(value),
};

const rate = {
  to: (value: number | null) => value,
  from: (value: string | number | null) => (value == null ? null : Number(value)),
};

@Entity('transacciones')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, transformer: money })
  monto: number;

  @Column({ type: 'varchar', length: 10 })
  fecha: string;

  @Column({ name: 'usuario_id', type: 'int' })
  usuarioId: number;

  @Column({ type: 'varchar', length: 3, default: 'ARS' })
  moneda: string;

  @Column({ type: 'numeric', precision: 14, scale: 4, nullable: true, transformer: rate })
  cotizacion: number | null;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn: Date;

  @ManyToOne(() => Category, { nullable: false, eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'categoria_id' })
  categoria: Category;

  @ManyToOne(() => TransactionType, { nullable: false, eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tipo_codigo', referencedColumnName: 'codigo' })
  tipo: TransactionType;
}
