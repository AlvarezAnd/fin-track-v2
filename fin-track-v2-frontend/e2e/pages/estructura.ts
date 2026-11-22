import { expect, type Locator, type Page } from "@playwright/test";

const MARCA = "data-e2e-persistente";

/** Cabecera, barra de navegación y botón del asistente que el layout comparte entre páginas. */
export class Estructura {
  readonly cabecera: Locator;
  readonly navegacion: Locator;
  readonly asistente: Locator;
  readonly sesion: Locator;

  constructor(private readonly page: Page) {
    this.cabecera = page.locator("header").first();
    this.navegacion = page.getByRole("navigation", { name: "Secciones" });
    this.asistente = page.getByRole("button", { name: "Abrir asistente" });
    this.sesion = page.getByRole("button", { name: "Menú de sesión" });
  }

  private piezas() {
    return [this.cabecera, this.navegacion, this.asistente];
  }

  /** Un nodo que se vuelve a montar pierde la marca. */
  async marcar() {
    for (const pieza of this.piezas()) {
      await pieza.evaluate((nodo, marca) => nodo.setAttribute(marca, "1"), MARCA);
    }
  }

  async expectSinRemontar() {
    for (const pieza of this.piezas()) {
      await expect(pieza).toHaveAttribute(MARCA, "1");
    }
  }

  /** Retrasa la respuesta de la página para poder mirar la interfaz mientras carga. */
  async demorar(ruta: string, milisegundos: number) {
    await this.page.route(
      (url) => url.pathname === ruta,
      async (route) => {
        await new Promise((resolve) => setTimeout(resolve, milisegundos));
        await route.continue();
      },
    );
  }

  async irA(seccion: string) {
    await this.navegacion.getByRole("link", { name: seccion }).click();
  }

  async expectCargando() {
    await expect(this.page.getByText("Cargando…").first()).toBeVisible();
  }

  /** Falla enseguida si algo (por ejemplo un spinner a pantalla completa) tapa el control. */
  async expectAccesibles() {
    for (const control of [this.cabecera.getByRole("button"), this.asistente, this.navegacion]) {
      await control.first().click({ trial: true, timeout: 300 });
    }
  }
}
