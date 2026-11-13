import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TransactionType } from './transaction-type.entity.js';

@Entity('categorias')
@Index('categorias_usuario_tipo_nombre', ['usuarioId', 'tipo', 'nombreClave'], {
  unique: true,
})
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 80 })
  nombre: string;

  @Column({ name: 'nombre_clave', type: 'varchar', length: 80 })
  nombreClave: string;

  @Column({ type: 'varchar', length: 32, default: 'etiqueta' })
  icono: string;

  @Column({ name: 'usuario_id', type: 'int' })
  usuarioId: number;

  @ManyToOne(() => TransactionType, {
    nullable: false,
    eager: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'tipo_codigo', referencedColumnName: 'codigo' })
  tipo: TransactionType;
}
