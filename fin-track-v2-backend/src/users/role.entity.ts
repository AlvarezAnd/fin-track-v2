import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from 'typeorm';
import { Permission } from './permission.entity.js';

@Entity('roles')
export class Role {
  @PrimaryColumn({ type: 'varchar', length: 32 })
  code: string;

  @Column({ type: 'varchar', length: 80 })
  name: string;

  @ManyToMany(() => Permission, { eager: true })
  @JoinTable({
    name: 'rol_permisos',
    joinColumn: { name: 'rol_codigo', referencedColumnName: 'code' },
    inverseJoinColumn: { name: 'permiso_codigo', referencedColumnName: 'code' },
  })
  permissions: Permission[];
}
