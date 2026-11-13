import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExchangeRate } from './exchange-rate.entity.js';

@Injectable()
export class ExchangeRateRepository {
  constructor(
    @InjectRepository(ExchangeRate)
    private readonly cotizaciones: Repository<ExchangeRate>,
  ) {}

  list() {
    return this.cotizaciones.find({ order: { moneda: 'ASC' } });
  }

  findByCurrency(moneda: string) {
    return this.cotizaciones.findOne({ where: { moneda } });
  }

  async save(moneda: string, valor: number) {
    const existing = await this.findByCurrency(moneda);

    if (!existing) {
      return this.cotizaciones.save(this.cotizaciones.create({ moneda, valor }));
    }

    existing.valor = valor;
    return this.cotizaciones.save(existing);
  }
}
