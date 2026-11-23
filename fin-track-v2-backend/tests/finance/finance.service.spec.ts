import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { DataSource, EntityManager } from 'typeorm';
import { Category } from '../../src/finance/category.entity.js';
import { crearXlsx } from '../../src/finance/xlsx.js';
import type { CategoryRepository } from '../../src/finance/category.repository.js';
import type { ExchangeRateRepository } from '../../src/finance/exchange-rate.repository.js';
import { FinanceService } from '../../src/finance/finance.service.js';
import { Transaction } from '../../src/finance/transaction.entity.js';
import type { TransactionRepository } from '../../src/finance/transaction.repository.js';
import { TransactionType } from '../../src/finance/transaction-type.entity.js';
import type { TransactionTypeRepository } from '../../src/finance/transaction-type.repository.js';

function tipo(codigo: TransactionType['codigo'] = 'ingreso'): TransactionType {
  return { codigo, nombre: codigo === 'ingreso' ? 'Ingreso' : 'Egreso' };
}

function categoria(partial: Partial<Category> = {}): Category {
  return {
    id: 1,
    nombre: 'Sueldo',
    nombreClave: 'sueldo',
    icono: 'trabajo',
    usuarioId: 1,
    tipo: tipo(),
    ...partial,
  };
}

function movimiento(partial: Partial<Transaction> = {}): Transaction {
  return {
    id: 1,
    monto: 1000,
    fecha: '2026-11-09',
    usuarioId: 1,
    moneda: 'USD',
    cotizacion: 1,
    detalle: null,
    creadoEn: new Date('2026-11-09T12:00:00Z'),
    categoria: categoria(),
    tipo: tipo(),
    ...partial,
  };
}

function serviceWith(options?: { initialized?: boolean }) {
  const dataSource = {
    isInitialized: options?.initialized ?? false,
    transaction: vi.fn(async (work: (manager: EntityManager) => unknown) => work({} as EntityManager)),
  };
  const tipos = {
    seed: vi.fn(),
    list: vi.fn(),
    findByCode: vi.fn(),
  };
  const categorias = {
    ensureUniqueIndex: vi.fn(),
    listAll: vi.fn().mockResolvedValue([]),
    listByType: vi.fn(),
    listByUser: vi.fn(),
    findById: vi.fn(),
    findOtherByName: vi.fn(),
    findByKey: vi.fn(),
    create: vi.fn(),
    save: vi.fn(async (value: Category) => value),
    delete: vi.fn(),
  };
  const transacciones = {
    listForMonth: vi.fn(),
    listInRange: vi.fn(),
    totals: vi.fn(),
    findById: vi.fn(),
    delete: vi.fn(),
    countByCategory: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
  };
  const cotizaciones = {
    list: vi.fn().mockResolvedValue([]),
    findByCurrency: vi.fn(),
    save: vi.fn(),
  };
  const service = new FinanceService(
    dataSource as unknown as DataSource,
    tipos as unknown as TransactionTypeRepository,
    categorias as unknown as CategoryRepository,
    transacciones as unknown as TransactionRepository,
    cotizaciones as unknown as ExchangeRateRepository,
  );

  return { service, dataSource, tipos, categorias, transacciones, cotizaciones };
}

describe('FinanceService', () => {
  it('skips seeding when the database is not connected', async () => {
    const { service, tipos, categorias } = serviceWith();

    await service.onModuleInit();

    expect(tipos.seed).not.toHaveBeenCalled();
    expect(categorias.ensureUniqueIndex).not.toHaveBeenCalled();
  });

  it('seeds types and replaces the generic icon when a name suggests one', async () => {
    const sueldo = categoria({ nombre: 'Sueldo', nombreClave: 'sueldo', icono: 'etiqueta' });
    const varios = categoria({ id: 2, nombre: 'Varios', icono: 'etiqueta' });
    const comida = categoria({ id: 3, nombre: 'Comida', icono: 'comida' });
    const { service, tipos, categorias } = serviceWith({ initialized: true });
    categorias.listAll.mockResolvedValue([sueldo, varios, comida]);

    await service.onModuleInit();

    expect(tipos.seed).toHaveBeenCalledOnce();
    expect(categorias.ensureUniqueIndex).toHaveBeenCalledOnce();
    expect(sueldo.icono).toBe('trabajo');
    expect(categorias.save).toHaveBeenCalledWith(sueldo);
    expect(varios.icono).toBe('etiqueta');
    expect(comida.icono).toBe('comida');
  });

  it('lists transaction types from the repository', async () => {
    const { service, tipos } = serviceWith();
    tipos.list.mockResolvedValue([tipo()]);

    await expect(service.listTypes()).resolves.toEqual([tipo()]);
  });

  it('rejects an unknown category type and maps a valid list', async () => {
    const { service, categorias } = serviceWith();
    categorias.listByType.mockResolvedValue([categoria()]);

    await expect(service.listCategories(1, 'otro')).rejects.toThrow(
      'El tipo de transacción no es válido.',
    );
    await expect(service.listCategories(1, 'ingreso')).resolves.toEqual([
      { id: 1, nombre: 'Sueldo', tipo: 'ingreso', icono: 'trabajo' },
    ]);
    expect(categorias.listByType).toHaveBeenCalledWith(1, 'ingreso');
  });

  it('creates a category with a suggested icon', async () => {
    const { service, tipos, categorias } = serviceWith();
    tipos.findByCode.mockResolvedValue(tipo('egreso'));
    categorias.findOtherByName.mockResolvedValue(null);
    categorias.create.mockResolvedValue(
      categoria({
        id: 4,
        nombre: 'Alquiler',
        nombreClave: 'alquiler',
        icono: 'casa',
        tipo: tipo('egreso'),
      }),
    );

    await expect(
      service.createCategory(1, { nombre: 'Alquiler', tipo: 'egreso' }),
    ).resolves.toEqual({
      id: 4,
      nombre: 'Alquiler',
      tipo: 'egreso',
      icono: 'casa',
    });
    expect(categorias.create).toHaveBeenCalledWith({
      nombre: 'Alquiler',
      nombreClave: 'alquiler',
      usuarioId: 1,
      tipo: tipo('egreso'),
      icono: 'casa',
    });
  });

  it('rejects a category create with bad input or a duplicate name', async () => {
    const { service, tipos, categorias } = serviceWith();

    await expect(service.createCategory(1, { tipo: 'egreso' })).rejects.toThrow(
      'Ingresá un nombre de hasta 80 caracteres.',
    );
    await expect(
      service.createCategory(1, { nombre: 'Alquiler', tipo: 'otro' }),
    ).rejects.toThrow('El tipo de transacción no es válido.');
    tipos.findByCode.mockResolvedValueOnce(null);
    await expect(
      service.createCategory(1, { nombre: 'Alquiler', tipo: 'egreso' }),
    ).rejects.toThrow('El tipo de transacción no está disponible.');
    tipos.findByCode.mockResolvedValue(tipo('egreso'));
    await expect(
      service.createCategory(1, {
        nombre: 'Alquiler',
        tipo: 'egreso',
        icono: 'no-existe',
      }),
    ).rejects.toThrow('El icono no es válido.');
    categorias.findOtherByName.mockResolvedValue(categoria({ id: 2 }));
    await expect(
      service.createCategory(1, { nombre: 'Alquiler', tipo: 'egreso' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates a category name and icon', async () => {
    const row = categoria();
    const { service, categorias } = serviceWith();
    categorias.findById.mockResolvedValue(row);
    categorias.findOtherByName.mockResolvedValue(null);

    await expect(
      service.updateCategory(1, '1', { nombre: 'Honorarios', icono: 'dinero' }),
    ).resolves.toEqual({
      id: 1,
      nombre: 'Honorarios',
      tipo: 'ingreso',
      icono: 'dinero',
    });
    expect(categorias.save).toHaveBeenCalledWith(row);
  });

  it('rejects a category update without fields, with a bad name, or a duplicate', async () => {
    const row = categoria();
    const { service, categorias } = serviceWith();

    await expect(service.updateCategory(1, '1', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    categorias.findById.mockResolvedValueOnce(null);
    await expect(service.updateCategory(1, '9', { nombre: 'Otra' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    categorias.findById.mockResolvedValue(row);
    await expect(service.updateCategory(1, '1', { nombre: ' ' })).rejects.toThrow(
      'Ingresá un nombre de hasta 80 caracteres.',
    );
    await expect(service.updateCategory(1, '1', { icono: 'no-existe' })).rejects.toThrow(
      'El icono no es válido.',
    );
    categorias.findOtherByName.mockResolvedValue(categoria({ id: 2 }));
    await expect(service.updateCategory(1, '1', { nombre: 'Alquiler' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('turns a unique-name database error into a conflict', async () => {
    const { service, categorias } = serviceWith();
    categorias.findById.mockResolvedValue(categoria());
    categorias.findOtherByName.mockResolvedValue(null);
    categorias.save.mockRejectedValue({ driverError: { code: '23505' } });

    await expect(service.updateCategory(1, '1', { nombre: 'Alquiler' })).rejects.toThrow(
      'Ya existe una categoría con ese nombre.',
    );
  });

  it('refuses to delete a category that still has movements', async () => {
    const { service, categorias, transacciones } = serviceWith();
    categorias.findById.mockResolvedValue(categoria());
    transacciones.countByCategory.mockResolvedValue(2);

    await expect(service.deleteCategory(1, '1')).rejects.toThrow(
      'No se puede eliminar una categoría con movimientos.',
    );
    expect(categorias.delete).not.toHaveBeenCalled();
  });

  it('deletes an unused category', async () => {
    const { service, categorias, transacciones } = serviceWith();
    categorias.findById.mockResolvedValue(categoria());
    transacciones.countByCategory.mockResolvedValue(0);

    await service.deleteCategory(1, '1');

    expect(categorias.delete).toHaveBeenCalledWith(1, 1);
  });

  it('builds the month summary and the balance', async () => {
    const { service, transacciones, categorias } = serviceWith();
    transacciones.listForMonth.mockResolvedValue([movimiento({ monto: 100.5 })]);
    categorias.listByUser.mockResolvedValue([
      categoria(),
      categoria({ id: 2, nombre: 'Comida', icono: 'comida', tipo: tipo('egreso') }),
    ]);

    await expect(service.summary(1, '2026-11')).resolves.toMatchObject({
      mes: '2026-11',
      moneda: 'USD',
      balance: 100.5,
      ingresos: 100.5,
      egresos: 0,
      categorias: {
        ingreso: [{ nombre: 'Sueldo', icono: 'trabajo' }],
        egreso: [{ nombre: 'Comida', icono: 'comida' }],
      },
      movimientos: [
        {
          id: 1,
          monto: 100.5,
          moneda: 'USD',
          cotizacion: 1,
          usd: 100.5,
          fecha: '2026-11-09',
          tipo: 'ingreso',
          categoria: 'Sueldo',
          icono: 'trabajo',
        },
      ],
    });
    expect(transacciones.listForMonth).toHaveBeenCalledWith(1, '2026-11-01', '2026-12-01');
  });

  it('rejects an inverted history range and lists a valid one', async () => {
    const { service, transacciones } = serviceWith();
    transacciones.listInRange.mockResolvedValue([movimiento()]);

    await expect(service.history(1, '2026-11-10', '2026-11-01')).rejects.toThrow(
      'El período no es válido.',
    );
    await expect(service.history(1, '2026-11-01', '2026-11-10')).resolves.toEqual({
      movimientos: [
        {
          id: 1,
          monto: 1000,
          moneda: 'USD',
          cotizacion: 1,
          usd: 1000,
          fecha: '2026-11-09',
          tipo: 'ingreso',
          categoria: 'Sueldo',
          icono: 'trabajo',
          detalle: null,
        },
      ],
    });
  });

  it('rejects an unknown export format and returns a csv of the history', async () => {
    const { service, transacciones } = serviceWith();
    transacciones.listInRange.mockResolvedValue([movimiento()]);

    await expect(service.exportar(1, 'docx')).rejects.toThrow(
      'El formato de exportación no es válido.',
    );

    const archivo = await service.exportar(1, 'csv');

    expect(archivo.nombre).toBe('movimientos.csv');
    expect(archivo.contenido.toString('utf8')).toContain('Sueldo');
    expect(transacciones.listInRange).toHaveBeenCalledWith(
      1,
      '1970-01-01',
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    );
  });

  it('creates a movement and a category when the name is new', async () => {
    const ingreso = tipo();
    const { service, dataSource, tipos, categorias, transacciones } = serviceWith();
    tipos.findByCode.mockResolvedValue(ingreso);
    categorias.findByKey.mockResolvedValue(null);
    categorias.create.mockImplementation(async (datos) => datos);
    transacciones.create.mockImplementation(async (datos) => ({ id: 1, ...datos }));

    const created = await service.create(1, {
      tipo: 'ingreso',
      monto: '1.250,50',
      categoria: 'Sueldo',
      fecha: '2026-11-09',
      moneda: 'USD',
    });

    expect(dataSource.transaction).toHaveBeenCalledOnce();
    expect(categorias.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Sueldo',
        nombreClave: 'sueldo',
        icono: 'trabajo',
        usuarioId: 1,
      }),
      expect.anything(),
    );
    expect(created).toMatchObject({
      monto: 1250.5,
      fecha: '2026-11-09',
      tipo: 'ingreso',
      categoria: 'Sueldo',
      icono: 'trabajo',
    });
  });

  it('stores the optional detail and rejects one that is too long', async () => {
    const { service, tipos, categorias, transacciones } = serviceWith();
    tipos.findByCode.mockResolvedValue(tipo());
    categorias.findByKey.mockResolvedValue(categoria());
    transacciones.create.mockImplementation(async (datos) => ({ id: 1, ...datos }));
    const base = {
      tipo: 'ingreso',
      monto: '10',
      categoria: 'Sueldo',
      fecha: '2026-11-09',
      moneda: 'USD',
    };

    await expect(service.create(1, { ...base, detalle: ' Aguinaldo ' })).resolves.toMatchObject({
      detalle: 'Aguinaldo',
    });
    await expect(service.create(1, base)).resolves.toMatchObject({ detalle: null });
    await expect(service.create(1, { ...base, detalle: 'x'.repeat(201) })).rejects.toThrow(
      'El detalle puede tener hasta 200 caracteres.',
    );
  });

  it('reuses a category and updates its icon when one is sent', async () => {
    const ingreso = tipo();
    const row = categoria({ icono: 'etiqueta' });
    const { service, tipos, categorias, transacciones } = serviceWith();
    tipos.findByCode.mockResolvedValue(ingreso);
    categorias.findByKey.mockResolvedValue(row);
    transacciones.create.mockImplementation(async (datos) => ({ id: 1, ...datos }));

    await service.create(1, {
      tipo: 'ingreso',
      monto: 10,
      categoria: 'Sueldo',
      fecha: '2026-11-09',
      icono: 'dinero',
      moneda: 'USD',
    });

    expect(categorias.create).not.toHaveBeenCalled();
    expect(row.icono).toBe('dinero');
    expect(categorias.save).toHaveBeenCalledWith(row, expect.anything());
  });

  it('rejects a movement without a type, amount, category, or date', async () => {
    const { service } = serviceWith();

    await expect(service.create(1, { monto: 10, categoria: 'Sueldo' })).rejects.toThrow(
      'El tipo de transacción no es válido.',
    );
    await expect(
      service.create(1, { tipo: 'ingreso', monto: 0, categoria: 'Sueldo' }),
    ).rejects.toThrow('Ingresá un monto mayor a cero');
    await expect(service.create(1, { tipo: 'ingreso', monto: 10, categoria: ' ' })).rejects.toThrow(
      'Ingresá una categoría',
    );
    await expect(
      service.create(1, { tipo: 'ingreso', monto: 10, categoria: 'Sueldo', fecha: '2026-02-31' }),
    ).rejects.toThrow('La fecha no es válida.');
  });

  it('rejects a type that is not seeded', async () => {
    const { service, tipos } = serviceWith();
    tipos.findByCode.mockResolvedValue(null);

    await expect(
      service.create(1, {
        tipo: 'ingreso',
        monto: 10,
        categoria: 'Sueldo',
        fecha: '2026-11-09',
        moneda: 'USD',
      }),
    ).rejects.toThrow('El tipo de transacción no está disponible.');
  });

  it('updates an existing movement and rejects a missing one', async () => {
    const row = movimiento();
    const { service, tipos, categorias, transacciones } = serviceWith();
    transacciones.findById.mockResolvedValueOnce(null);

    await expect(
      service.update(1, '9', {
        tipo: 'egreso',
        monto: 20,
        categoria: 'Comida',
        fecha: '2026-11-10',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    transacciones.findById.mockResolvedValue(row);
    tipos.findByCode.mockResolvedValue(tipo('egreso'));
    categorias.findByKey.mockResolvedValue(categoria({ nombre: 'Comida', tipo: tipo('egreso') }));
    transacciones.save.mockImplementation(async (value) => value);

    await expect(
      service.update(1, '1', {
        tipo: 'egreso',
        monto: 20,
        categoria: 'Comida',
        fecha: '2026-11-10',
        moneda: 'USD',
      }),
    ).resolves.toMatchObject({ id: 1, monto: 20, tipo: 'egreso', fecha: '2026-11-10' });
    expect(transacciones.save).toHaveBeenCalledWith(row, expect.anything());
  });

  it('removes a movement and reports when it does not exist', async () => {
    const { service, transacciones } = serviceWith();
    transacciones.delete.mockResolvedValueOnce({ affected: 0 });

    await expect(service.remove(1, '9')).rejects.toBeInstanceOf(NotFoundException);

    transacciones.delete.mockResolvedValueOnce({ affected: 1 });
    await expect(service.remove(1, '1')).resolves.toBeUndefined();
    expect(transacciones.delete).toHaveBeenCalledWith(1, 1);
  });

  it('imports amount rows into the Importado category and rejects a missing rate', async () => {
    const ingreso = tipo();
    const { service, dataSource, tipos, categorias, transacciones, cotizaciones } = serviceWith();
    tipos.findByCode.mockResolvedValue(ingreso);
    categorias.findByKey.mockResolvedValue(null);
    categorias.create.mockImplementation(async (datos) => datos);
    transacciones.create.mockImplementation(async (datos) => ({ id: 4, ...datos }));
    cotizaciones.findByCurrency.mockResolvedValue(null);
    const archivo = crearXlsx([
      {
        nombre: 'Movimientos',
        filas: [
          ['Fecha', 'Tipo', 'Moneda', 'Monto'],
          ['2026-11-13', 'Ingreso', 'USD', '10'],
          ['2026-11-13', 'Ingreso', 'ARS', '20'],
        ],
      },
    ]);

    await expect(service.importRows(1, archivo)).rejects.toMatchObject({
      response: {
        errores: ['Registrá el cambio de ARS antes de importar.'],
      },
    });
    expect(transacciones.create).not.toHaveBeenCalled();

    cotizaciones.findByCurrency.mockResolvedValue({ moneda: 'ARS', valor: 1400 });
    await expect(service.importRows(1, archivo)).resolves.toEqual({ importados: 2 });
    expect(dataSource.transaction).toHaveBeenCalledOnce();
    expect(categorias.create).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Importado', nombreClave: 'importado' }),
      expect.anything(),
    );
    expect(transacciones.create).toHaveBeenCalledTimes(2);
  });
});
