import { expect, type Page } from "@playwright/test";

export class PaginaCategorias {
  constructor(private readonly page: Page) {}

  async abrir() {
    await this.page.getByRole("link", { name: "Categorías" }).click();
    await expect(this.page.getByRole("heading", { name: "Categorías" })).toBeVisible();
  }

  private async verIngresos() {
    await this.page
      .getByRole("group", { name: "Tipo de categoría" })
      .getByRole("button", { name: "Ingresos" })
      .click();
  }

  async renombrar(actual: string, nuevo: string) {
    await this.verIngresos();
    await expect(this.page.getByRole("button", { name: `Editar ${actual}` })).toBeVisible();
    await this.page.getByRole("button", { name: `Editar ${actual}` }).click();

    const dialog = this.page.getByRole("dialog", { name: "Editar categoría" });
    await dialog.getByLabel("Nombre").fill(nuevo);
    await dialog.getByRole("button", { name: "Guardar" }).click();
    await expect(dialog).toBeHidden();
    await expect(this.page.getByRole("button", { name: `Editar ${nuevo}` })).toBeVisible();
  }

  async eliminar(nombre: string) {
    await this.verIngresos();
    await this.page.getByRole("button", { name: `Eliminar ${nombre}` }).click();
    await this.page
      .getByRole("dialog", { name: "¿Eliminar esta categoría?" })
      .getByRole("button", { name: "Eliminar" })
      .click();
    await expect(this.page.getByRole("button", { name: `Editar ${nombre}` })).toHaveCount(0);
  }

  async eliminarVacia(nombre: string) {
    const response = await this.page.request.get("/api/finanzas/categorias");
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as {
      ingreso: { id: string; nombre: string }[];
      egreso: { id: string; nombre: string }[];
    };
    const categoria = [...body.ingreso, ...body.egreso].find((item) => item.nombre === nombre);

    if (!categoria) {
      throw new Error(`No está la categoría ${nombre}.`);
    }

    const deleted = await this.page.request.delete(`/api/finanzas/categorias/${categoria.id}`);
    expect(deleted.ok()).toBeTruthy();
  }
}
