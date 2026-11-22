import { expect, test } from "@playwright/test";
import { Estructura } from "./pages/estructura";
import { PaginaIngreso } from "./pages/pagina-ingreso";

// El service worker de la PWA atiende las peticiones y Playwright no puede retrasarlas.
test.use({ serviceWorkers: "block" });

test("la cabecera, la navegación y el asistente no se afectan al cambiar de página", async ({
  page,
}) => {
  const ingreso = new PaginaIngreso(page);
  const estructura = new Estructura(page);

  // Por debajo de xl se ve la barra inferior en lugar del sidebar.
  await page.setViewportSize({ width: 800, height: 900 });
  await ingreso.entrar();
  await estructura.marcar();
  await estructura.demorar("/dashboard/movimientos", 1500);

  await estructura.irA("Movimientos");
  await estructura.expectCargando();
  await estructura.expectAccesibles();

  await expect(page.getByRole("heading", { name: "Movimientos", exact: true })).toBeVisible();
  await estructura.expectSinRemontar();
});
