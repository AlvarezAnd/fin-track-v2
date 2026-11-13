import { expect, type Locator, type Page } from "@playwright/test";
import { ListaMovimientos } from "./lista-movimientos";

export class PaginaResumen {
  readonly lista: ListaMovimientos;

  constructor(private readonly page: Page) {
    this.lista = new ListaMovimientos(page);
  }

  async expectCargado() {
    await expect(this.page.getByRole("region", { name: "Balance del mes" })).toBeVisible();
    await expect(this.page.getByRole("button", { name: "Este Mes", pressed: true })).toBeVisible();
    await expect(this.page.getByRole("heading", { name: "Ingresos" })).toBeVisible();
    await expect(this.page.getByRole("heading", { name: "Egresos" })).toBeVisible();
  }

  async registrar(tipo: "Ingreso" | "Egreso", categoria: string, monto: string) {
    await this.page.getByRole("button", { name: tipo, exact: true }).click();
    const dialog = this.page.getByRole("dialog", { name: "Nuevo movimiento" });
    await expect(dialog.getByRole("button", { name: tipo, pressed: true })).toBeVisible();
    await dialog.getByLabel("Monto").fill(monto);
    await dialog.getByLabel("Categoría").fill(categoria);
    await completarCambio(dialog);
    await dialog.getByRole("button", { name: "Registrar" }).click();
    await expect(dialog).toBeHidden();
  }

  async editarMonto(categoria: string, monto: string) {
    const fila = this.lista.fila(categoria);
    await fila.hover();
    await fila.getByRole("button", { name: "Editar movimiento" }).click();

    const dialog = this.page.getByRole("dialog", { name: "Editar movimiento" });
    await dialog.getByLabel("Monto").fill(monto);
    await completarCambio(dialog);
    await dialog.getByRole("button", { name: "Guardar" }).click();
    await expect(dialog).toBeHidden();
    await expect(fila).toContainText(monto);
  }
}

async function completarCambio(dialog: Locator) {
  const cambio = dialog.getByLabel(/por dólar/i);

  if (await cambio.isVisible()) {
    await cambio.fill("1400");
  }
}
