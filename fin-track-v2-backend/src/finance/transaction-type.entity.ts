import { Column, Entity, PrimaryColumn } from 'typeorm';
import type { CodigoTipo } from './finance.validation.js';

@Entity('tipos_transaccion')
export class TransactionType {
  @PrimaryColumn({ type: 'varchar', length: 16 })
  codigo: CodigoTipo;

  @Column({ type: 'varchar', length: 32 })
  nombre: string;
}
