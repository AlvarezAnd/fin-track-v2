import { test } from "@playwright/test";
import { PaginaIngreso } from "./pages/pagina-ingreso";

test("la pantalla de ingreso muestra el formulario", async ({ page }) => {
  const ingreso = new PaginaIngreso(page);

  await ingreso.abrir();
  await ingreso.expectFormulario();
});
