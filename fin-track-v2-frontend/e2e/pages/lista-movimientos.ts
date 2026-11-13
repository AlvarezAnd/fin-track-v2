import { expect, type Page } from "@playwright/test";

export class ListaMovimientos {
  constructor(private readonly page: Page) {}

  fila(categoria: string) {
    return this.page
      .getByRole("main")
      .locator("div.group")
      .filter({ hasText: categoria, visible: true });
  }

  async expectFila(categoria: string, ...textos: string[]) {
    const fila = this.fila(categoria);
    await expect(fila).toBeVisible();

    for (const texto of textos) {
      await expect(fila).toContainText(texto);
    }
  }

  async expectAusente(categoria: string) {
    await expect(this.fila(categoria)).toHaveCount(0);
  }

  async eliminar(categoria: string) {
    const fila = this.fila(categoria);
    await fila.hover();
    await fila.getByRole("button", { name: "Eliminar movimiento" }).click();
    await this.page.getByRole("button", { name: "Eliminar", exact: true }).click();
    await expect(fila).toHaveCount(0);
  }
}
