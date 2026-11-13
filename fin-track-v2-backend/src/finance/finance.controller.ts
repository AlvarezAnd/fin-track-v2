import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  StreamableFile,
} from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import type { AppUser } from '../users/app-user.js';
import { AccessPolicy } from '../users/access.policy.js';
import { FinanceService } from './finance.service.js';

@Controller()
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

  @Get('tipos-transaccion')
  @Can(AccessPolicy, 'readFinance')
  listTypes() {
    return this.finance.listTypes();
  }

  @Get('categorias')
  @Can(AccessPolicy, 'readFinance')
  listCategories(@CurrentUser() user: AppUser, @Query('tipo') tipo?: string) {
    return this.finance.listCategories(user.id, tipo);
  }

  @Patch('categorias/:id')
  @Can(AccessPolicy, 'writeFinance')
  updateCategory(
    @CurrentUser() user: AppUser,
    @Param('id') id: string,
    @Body() body: { nombre?: unknown; icono?: unknown },
  ) {
    return this.finance.updateCategory(user.id, id, body);
  }

  @Delete('categorias/:id')
  @HttpCode(204)
  @Can(AccessPolicy, 'writeFinance')
  deleteCategory(@CurrentUser() user: AppUser, @Param('id') id: string) {
    return this.finance.deleteCategory(user.id, id);
  }

  @Get('cotizaciones')
  @Can(AccessPolicy, 'readFinance')
  listRates() {
    return this.finance.listRates();
  }

  @Put('cotizaciones/:moneda')
  @Can(AccessPolicy, 'manageRates')
  saveRate(
    @Param('moneda') moneda: string,
    @Body() body: { valor?: unknown },
  ) {
    return this.finance.saveRate(moneda, body);
  }

  @Get('transacciones')
  @Can(AccessPolicy, 'readFinance')
  list(
    @CurrentUser() user: AppUser,
    @Query('mes') mes?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    if (desde != null || hasta != null) {
      return this.finance.history(user.id, desde, hasta);
    }

    return this.finance.summary(user.id, mes);
  }

  @Get('transacciones/importar/plantilla')
  @Can(AccessPolicy, 'writeFinance')
  importTemplate() {
    const archivo = this.finance.importTemplate();

    return new StreamableFile(archivo.contenido, {
      type: archivo.tipo,
      disposition: `attachment; filename="${archivo.nombre}"`,
      length: archivo.contenido.length,
    });
  }

  @Post('transacciones/importar')
  @HttpCode(201)
  @Can(AccessPolicy, 'writeFinance')
  importRows(@CurrentUser() user: AppUser, @Req() request: Request) {
    const archivo = Buffer.isBuffer(request.body) ? request.body : Buffer.alloc(0);
    return this.finance.importRows(user.id, archivo);
  }

  @Get('transacciones/exportar/:formato')
  @Can(AccessPolicy, 'readFinance')
  async exportar(@CurrentUser() user: AppUser, @Param('formato') formato: string) {
    const archivo = await this.finance.exportar(user.id, formato);

    return new StreamableFile(archivo.contenido, {
      type: archivo.tipo,
      disposition: `attachment; filename="${archivo.nombre}"`,
      length: archivo.contenido.length,
    });
  }

  @Post('transacciones')
  @HttpCode(201)
  @Can(AccessPolicy, 'writeFinance')
  create(@CurrentUser() user: AppUser, @Body() body: Record<string, unknown>) {
    return this.finance.create(user.id, body);
  }

  @Patch('transacciones/:id')
  @Can(AccessPolicy, 'writeFinance')
  update(
    @CurrentUser() user: AppUser,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.finance.update(user.id, id, body);
  }

  @Delete('transacciones/:id')
  @HttpCode(204)
  @Can(AccessPolicy, 'writeFinance')
  remove(@CurrentUser() user: AppUser, @Param('id') id: string) {
    return this.finance.remove(user.id, id);
  }
}
