import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('permisos')
export class Permission {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  code: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;
}
