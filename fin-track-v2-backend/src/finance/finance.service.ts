import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { DataSource, type EntityManager } from 'typeorm';
import { parseEntityId } from '../database/entity-id.js';
import { CategoryRepository } from './category.repository.js';
import { Category } from './category.entity.js';
import { ExchangeRateRepository } from './exchange-rate.repository.js';
import {
  currentDate,
  currentMonth,
  suggestedIcon,
  monthBounds,
  parseCategory,
  parseDate,
  parseIcon,
  parseMonth,
  parseAmount,
  parseMoneda,
  parseRate,
  parseType,
  MONEDA_REFERENCIA,
  type CodigoTipo,
  type Icono,
  type MonedaCodigo,
} from './finance.validation.js';
import { TransactionTypeRepository } from './transaction-type.repository.js';
import { TransactionType } from './transaction-type.entity.js';
import { exportarMovimientos, parseFormato } from './export.js';
import { CATEGORIA_IMPORTADA, leerMovimientos, plantillaImportacion } from './import-sheet.js';
import { amountInUsd, roundMoney } from './money.js';
import { TransactionRepository } from './transaction.repository.js';
import { Transaction } from './transaction.entity.js';

type MovimientoBody = {
  tipo?: unknown;
  monto?: unknown;
  categoria?: unknown;
  fecha?: unknown;
  icono?: unknown;
  moneda?: unknown;
};

@Injectable()
export class FinanceService implements OnModuleInit {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tipos: TransactionTypeRepository,
    private readonly categorias: CategoryRepository,
    private readonly transacciones: TransactionRepository,
    private readonly cotizaciones: ExchangeRateRepository,
  ) {}

  async onModuleInit() {
    if (!this.dataSource.isInitialized) {
      return;
    }

    await this.tipos.seed();
    await this.categorias.ensureUniqueIndex();
    await this.backfillIcons();
  }

  listTypes() {
    return this.tipos.list();
  }

  async listCategories(usuarioId: number, tipo: unknown) {
    const codigo = parseType(tipo);

    if (!codigo) {
      throw new BadRequestException('El tipo de transacción no es válido.');
    }

    const categorias = await this.categorias.listByType(usuarioId, codigo);

    return categorias.map((categoria) => ({
      id: categoria.id,
      nombre: categoria.nombre,
      tipo: categoria.tipo.codigo,
      icono: categoria.icono,
    }));
  }

  async updateCategory(
    usuarioId: number,
    id: string,
    body: { nombre?: unknown; icono?: unknown },
  ) {
    if (body?.nombre === undefined && body?.icono === undefined) {
      throw new BadRequestException('Indicá el nombre o el icono.');
    }

    const categoria = await this.findCategory(usuarioId, id);
    const nombre =
      body.nombre === undefined ? categoria.nombre : parseCategory(body.nombre);
    const icono = body.icono === undefined ? categoria.icono : parseIcon(body.icono);

    if (body.nombre !== undefined && !nombre) {
      throw new BadRequestException('Ingresá un nombre de hasta 80 caracteres.');
    }

    if (body.icono !== undefined && !icono) {
      throw new BadRequestException('El icono no es válido.');
    }

    const nombreClave = nombre!.toLocaleLowerCase('es-AR');

    if (nombreClave !== categoria.nombreClave) {
      const duplicada = await this.categorias.findOtherByName(
        usuarioId,
        nombreClave,
        categoria.tipo.codigo,
        categoria.id,
      );

      if (duplicada) {
        throw new ConflictException('Ya existe una categoría con ese nombre.');
      }
    }

    categoria.nombre = nombre!;
    categoria.nombreClave = nombreClave;
    categoria.icono = icono!;

    try {
      await this.categorias.save(categoria);
    } catch (error) {
      if (isDuplicateName(error)) {
        throw new ConflictException('Ya existe una categoría con ese nombre.');
      }

      throw error;
    }

    return presentCategory(categoria);
  }

  async deleteCategory(usuarioId: number, id: string) {
    const categoria = await this.findCategory(usuarioId, id);
    const usos = await this.transacciones.countByCategory(usuarioId, categoria.id);

    if (usos > 0) {
      throw new ConflictException('No se puede eliminar una categoría con movimientos.');
    }

    await this.categorias.delete(categoria.id, usuarioId);
  }

  private async findCategory(usuarioId: number, id: string) {
    const categoryId = parseEntityId(id);
    const categoria = categoryId ? await this.categorias.findById(usuarioId, categoryId) : null;

    if (!categoria) {
      throw new NotFoundException('La categoría no existe.');
    }

    return categoria;
  }

  async listRates() {
    const cotizaciones = await this.cotizaciones.list();

    return cotizaciones.map((cotizacion) => ({
      moneda: cotizacion.moneda,
      valor: cotizacion.valor,
    }));
  }

  async saveRate(moneda: string, body: { valor?: unknown }) {
    const codigo = parseMoneda(moneda);

    if (!codigo || codigo === MONEDA_REFERENCIA) {
      throw new BadRequestException('La moneda no admite un cambio.');
    }

    const valor = parseRate(body?.valor);

    if (valor == null) {
      throw new BadRequestException('Indicá a cuántas unidades de la moneda equivale 1 USD.');
    }

    const guardada = await this.cotizaciones.save(codigo, valor);

    return { moneda: guardada.moneda, valor: guardada.valor };
  }

  async summary(usuarioId: number, mes: unknown) {
    const periodo = parseMonth(mes) ?? currentMonth();
    const { start, end } = monthBounds(periodo);
    const [movimientos, categorias, cambios] = await Promise.all([
      this.transacciones.listForMonth(usuarioId, start, end),
      this.categorias.listByUser(usuarioId),
      this.rateMap(),
    ]);
    const presentados = movimientos.map((movimiento) =>
      presentMovement(movimiento, amountInUsd(movimiento, cambios)),
    );
    const ingresos = sumUsd(presentados, 'ingreso');
    const egresos = sumUsd(presentados, 'egreso');

    return {
      mes: periodo,
      moneda: MONEDA_REFERENCIA,
      balance: roundMoney(ingresos - egresos),
      ingresos,
      egresos,
      categorias: {
        ingreso: summarizeCategories(categorias, 'ingreso'),
        egreso: summarizeCategories(categorias, 'egreso'),
      },
      movimientos: presentados,
    };
  }

  async history(usuarioId: number, desde: unknown, hasta: unknown) {
    const start = parseDate(desde);
    const end = parseDate(hasta);

    if (!start || !end || start > end) {
      throw new BadRequestException('El período no es válido.');
    }

    const [movimientos, cambios] = await Promise.all([
      this.transacciones.listInRange(usuarioId, start, end),
      this.rateMap(),
    ]);

    return {
      movimientos: movimientos.map((movimiento) =>
        presentMovement(movimiento, amountInUsd(movimiento, cambios)),
      ),
    };
  }

  async exportar(usuarioId: number, formato: unknown) {
    const elegido = parseFormato(formato);

    if (!elegido) {
      throw new BadRequestException('El formato de exportación no es válido.');
    }

    const movimientos = await this.transacciones.listInRange(
      usuarioId,
      '1970-01-01',
      currentDate(),
    );

    return exportarMovimientos(
      elegido,
      movimientos.map((movimiento) => ({
        fecha: movimiento.fecha,
        tipo: movimiento.tipo.codigo,
        categoria: movimiento.categoria.nombre,
        moneda: movimiento.moneda,
        monto: roundMoney(movimiento.monto),
        cotizacion: movimiento.cotizacion,
      })),
    );
  }

  importTemplate() {
    return {
      nombre: 'formato-movimientos.xlsx',
      tipo: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      contenido: plantillaImportacion(),
    };
  }

  async importRows(usuarioId: number, archivo: Buffer) {
    const leido = leerMovimientos(archivo);

    if (leido.errores.length > 0) {
      throw new BadRequestException({
        message: 'El archivo no se pudo importar.',
        errores: leido.errores,
      });
    }

    const sinCambio = new Set<MonedaCodigo>();

    for (const fila of leido.filas) {
      if (fila.moneda === MONEDA_REFERENCIA) {
        continue;
      }

      const cotizacion = await this.cotizaciones.findByCurrency(fila.moneda);

      if (!cotizacion) {
        sinCambio.add(fila.moneda);
      }
    }

    if (sinCambio.size > 0) {
      throw new BadRequestException({
        message: 'El archivo no se pudo importar.',
        errores: [...sinCambio].map((moneda) => `Registrá el cambio de ${moneda} antes de importar.`),
      });
    }

    await this.dataSource.transaction(async (manager) => {
      for (const fila of leido.filas) {
        const tipoTransaction = await this.requireType(manager, fila.tipo);
        const categoria = await this.resolveCategory(
          manager,
          usuarioId,
          tipoTransaction,
          CATEGORIA_IMPORTADA,
          undefined,
        );

        await this.transacciones.create(
          {
            monto: fila.monto,
            fecha: fila.fecha,
            usuarioId,
            moneda: fila.moneda,
            cotizacion: await this.requireRate(fila.moneda),
            categoria,
            tipo: tipoTransaction,
          },
          manager,
        );
      }
    });

    return { importados: leido.filas.length };
  }

  async create(usuarioId: number, body: MovimientoBody) {
    const datos = this.movementInput(body);
    const cotizacion = await this.requireRate(datos.moneda);
    const movimiento = await this.dataSource.transaction(async (manager) => {
      const tipoTransaction = await this.requireType(manager, datos.tipo);
      const categoria = await this.resolveCategory(
        manager,
        usuarioId,
        tipoTransaction,
        datos.categoriaNombre,
        datos.icono,
      );

      return this.transacciones.create(
        {
          monto: datos.monto,
          fecha: datos.fecha,
          usuarioId,
          moneda: datos.moneda,
          cotizacion,
          categoria,
          tipo: tipoTransaction,
        },
        manager,
      );
    });

    return presentMovement(movimiento, amountInUsd(movimiento, new Map()));
  }

  async update(usuarioId: number, id: string, body: MovimientoBody) {
    const movementId = parseEntityId(id);
    const existente = movementId
      ? await this.transacciones.findById(usuarioId, movementId)
      : null;

    if (!existente) {
      throw new NotFoundException('El movimiento no existe.');
    }

    const datos = this.movementInput(body);
    const cotizacion = await this.requireRate(datos.moneda);
    const movimiento = await this.dataSource.transaction(async (manager) => {
      const tipoTransaction = await this.requireType(manager, datos.tipo);
      const categoria = await this.resolveCategory(
        manager,
        usuarioId,
        tipoTransaction,
        datos.categoriaNombre,
        datos.icono,
      );

      existente.monto = datos.monto;
      existente.fecha = datos.fecha;
      existente.moneda = datos.moneda;
      existente.cotizacion = cotizacion;
      existente.tipo = tipoTransaction;
      existente.categoria = categoria;

      return this.transacciones.save(existente, manager);
    });

    return presentMovement(movimiento, amountInUsd(movimiento, new Map()));
  }

  async remove(usuarioId: number, id: string) {
    const movementId = parseEntityId(id);

    if (!movementId) {
      throw new NotFoundException('El movimiento no existe.');
    }

    const result = await this.transacciones.delete(usuarioId, movementId);

    if (!result.affected) {
      throw new NotFoundException('El movimiento no existe.');
    }
  }

  private movementInput(body: MovimientoBody) {
    const tipo = parseType(body?.tipo);
    const monto = parseAmount(body?.monto);
    const categoriaNombre = parseCategory(body?.categoria);
    const fecha = body?.fecha == null ? currentDate() : parseDate(body.fecha);
    const icono = parseIcon(body?.icono);
    const moneda = parseMoneda(body?.moneda);

    if (!tipo) {
      throw new BadRequestException('El tipo de transacción no es válido.');
    }

    if (monto == null) {
      throw new BadRequestException('Ingresá un monto mayor a cero, con hasta dos decimales.');
    }

    if (!categoriaNombre) {
      throw new BadRequestException('Ingresá una categoría de hasta 80 caracteres.');
    }

    if (!fecha) {
      throw new BadRequestException('La fecha no es válida.');
    }

    if (icono === null) {
      throw new BadRequestException('El icono no es válido.');
    }

    if (!moneda) {
      throw new BadRequestException('Indicá la moneda.');
    }

    return { tipo, monto, categoriaNombre, fecha, icono, moneda };
  }

  private async requireRate(moneda: MonedaCodigo) {
    if (moneda === MONEDA_REFERENCIA) {
      return 1;
    }

    const cotizacion = await this.cotizaciones.findByCurrency(moneda);

    if (!cotizacion) {
      throw new BadRequestException('Registrá el cambio de la moneda.');
    }

    return cotizacion.valor;
  }

  private async rateMap() {
    const cotizaciones = await this.cotizaciones.list();
    return new Map(cotizaciones.map((cotizacion) => [cotizacion.moneda, cotizacion.valor]));
  }

  private async requireType(manager: EntityManager, tipo: CodigoTipo) {
    const tipoTransaction = await this.tipos.findByCode(tipo, manager);

    if (!tipoTransaction) {
      throw new BadRequestException('El tipo de transacción no está disponible.');
    }

    return tipoTransaction;
  }

  private async resolveCategory(
    manager: EntityManager,
    usuarioId: number,
    tipoTransaction: TransactionType,
    categoriaNombre: string,
    icono: Icono | undefined,
  ) {
    const nombreClave = categoriaNombre.toLocaleLowerCase('es-AR');
    let categoria = await this.categorias.findByKey(
      usuarioId,
      nombreClave,
      tipoTransaction.codigo,
      manager,
    );
    const elegido = icono ?? suggestedIcon(categoriaNombre);

    if (!categoria) {
      return this.categorias.create(
        {
          nombre: categoriaNombre,
          nombreClave,
          usuarioId,
          tipo: tipoTransaction,
          icono: elegido,
        },
        manager,
      );
    }

    if (icono && categoria.icono !== icono) {
      categoria.icono = icono;
      categoria = await this.categorias.save(categoria, manager);
    }

    return categoria;
  }

  private async backfillIcons() {
    const categorias = await this.categorias.listAll();

    for (const categoria of categorias) {
      if (categoria.icono !== 'etiqueta') {
        continue;
      }

      const sugerido = suggestedIcon(categoria.nombre);

      if (sugerido === 'etiqueta') {
        continue;
      }

      categoria.icono = sugerido;
      await this.categorias.save(categoria);
    }
  }
}

function presentCategory(categoria: Category) {
  return {
    id: categoria.id,
    nombre: categoria.nombre,
    tipo: categoria.tipo.codigo,
    icono: categoria.icono,
  };
}

function isDuplicateName(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'driverError' in error &&
    (error as { driverError?: { code?: string } }).driverError?.code === '23505'
  );
}

function summarizeCategories(categorias: Category[], tipo: CodigoTipo) {
  return categorias
    .filter((categoria) => categoria.tipo.codigo === tipo)
    .map((categoria) => ({
      nombre: categoria.nombre,
      icono: categoria.icono,
    }));
}

function presentMovement(movimiento: Transaction, usd: number | null) {
  return {
    id: movimiento.id,
    monto: roundMoney(movimiento.monto),
    moneda: movimiento.moneda,
    cotizacion: movimiento.cotizacion,
    usd,
    fecha: movimiento.fecha,
    tipo: movimiento.tipo.codigo,
    categoria: movimiento.categoria.nombre,
    icono: movimiento.categoria.icono,
  };
}

function sumUsd(
  movimientos: Array<{ tipo: CodigoTipo; usd: number | null }>,
  tipo: CodigoTipo,
) {
  return roundMoney(
    movimientos.reduce((total, movimiento) => {
      if (movimiento.tipo !== tipo || movimiento.usd == null) {
        return total;
      }

      return total + movimiento.usd;
    }, 0),
  );
}
