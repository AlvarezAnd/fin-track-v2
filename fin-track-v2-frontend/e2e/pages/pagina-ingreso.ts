import { expect, type Locator, type Page } from "@playwright/test";

export class PaginaIngreso {
  readonly usuario: Locator;
  readonly contrasena: Locator;

  constructor(private readonly page: Page) {
    this.usuario = page.getByLabel("Nombre de usuario");
    this.contrasena = page.getByLabel("Contraseña");
  }

  async abrir() {
    await this.page.goto("/login");
  }

  async expectFormulario() {
    await expect(this.page.getByRole("heading", { name: "Ingresar" })).toBeVisible();
    await expect(this.usuario).toBeVisible();
    await expect(this.contrasena).toBeVisible();
  }

  async entrar(
    usuario = process.env.E2E_USERNAME ?? "admin",
    contrasena = process.env.E2E_PASSWORD ?? "admin",
  ) {
    await this.abrir();
    await this.usuario.fill(usuario);
    await this.contrasena.fill(contrasena);
    await this.page.getByRole("button", { name: "Ingresar" }).click();
    await expect(this.page.getByRole("heading", { name: "Resumen" })).toBeVisible();
  }

  async expectVisible() {
    await expect(this.page.getByRole("heading", { name: "Ingresar" })).toBeVisible();
  }

  async abrirDashboardSinSesion() {
    await this.page.goto("/dashboard");
    await this.expectVisible();
  }
}
