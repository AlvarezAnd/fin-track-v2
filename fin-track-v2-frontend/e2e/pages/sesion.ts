import { type Page } from "@playwright/test";

export class Sesion {
  constructor(private readonly page: Page) {}

  async cerrar() {
    await this.page.getByRole("button", { name: "Menú de sesión" }).click();
    await this.page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
  }
}
