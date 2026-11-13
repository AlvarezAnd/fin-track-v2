import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

const rate = {
  to: (value: number) => value,
  from: (value: string | number | null) => (value == null ? null : Number(value)),
};

@Entity('cotizaciones')
export class ExchangeRate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 3, unique: true })
  moneda: string;

  @Column({ type: 'numeric', precision: 14, scale: 4, transformer: rate })
  valor: number;
}
