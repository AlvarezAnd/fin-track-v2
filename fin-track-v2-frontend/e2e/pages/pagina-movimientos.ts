import { expect, type Page } from "@playwright/test";
import { ListaMovimientos } from "./lista-movimientos";

export class PaginaMovimientos {
  readonly lista: ListaMovimientos;

  constructor(private readonly page: Page) {
    this.lista = new ListaMovimientos(page);
  }

  async abrir() {
    await this.page.getByRole("link", { name: "Movimientos" }).click();
    await expect(this.page.getByRole("heading", { name: "Movimientos", exact: true })).toBeVisible();
  }

  async buscar(texto: string) {
    await this.page.getByPlaceholder("Buscar por categoría o monto...").fill(texto);
  }

  async expectUnRegistro() {
    // Resumen has the same counter and can stay mounted but hidden after navigating.
    await expect(
      this.page.getByText("1 registro encontrado").filter({ visible: true }),
    ).toBeVisible();
  }

  async expectSinResultados() {
    await expect(this.page.getByText("Ningún movimiento coincide con los filtros.")).toBeVisible();
  }

  async filtrar(tipo: "Todos" | "Ingresos" | "Egresos") {
    await this.page
      .getByRole("group", { name: "Tipo de movimiento" })
      .getByRole("button", { name: tipo })
      .click();
  }

  async exportarCsv() {
    const exportar = this.page.getByRole("button", { name: "Exportar" });
    await expect(exportar).toBeEnabled();
    await exportar.click();

    const descarga = this.page.waitForEvent("download");
    await this.page.getByRole("menuitem", { name: "CSV" }).click();
    const archivo = await descarga;

    expect(archivo.suggestedFilename()).toMatch(/\.csv$/);
  }
}
