import { test } from "@playwright/test";
import { categoriaUnica } from "./datos";
import { Asistente } from "./pages/asistente";
import { PaginaCategorias } from "./pages/pagina-categorias";
import { PaginaIngreso } from "./pages/pagina-ingreso";
import { PaginaMovimientos } from "./pages/pagina-movimientos";
import { PaginaResumen } from "./pages/pagina-resumen";
import { Sesion } from "./pages/sesion";

test.describe.configure({ mode: "serial" });

test("inicia sesión y muestra el resumen", async ({ page }) => {
  const ingreso = new PaginaIngreso(page);
  const resumen = new PaginaResumen(page);

  await ingreso.entrar();
  await resumen.expectCargado();
});

test("registra un ingreso y lo muestra en el resumen", async ({ page }) => {
  const categoria = categoriaUnica("ingreso");
  const ingreso = new PaginaIngreso(page);
  const resumen = new PaginaResumen(page);
  const categorias = new PaginaCategorias(page);

  await ingreso.entrar();
  await resumen.registrar("Ingreso", categoria, "1500,50");
  await resumen.lista.expectFila(categoria, "Ingreso", "1.500,50");
  await resumen.lista.eliminar(categoria);
  await categorias.eliminarVacia(categoria);
});

test("registra un egreso y lo muestra en el resumen", async ({ page }) => {
  const categoria = categoriaUnica("egreso");
  const ingreso = new PaginaIngreso(page);
  const resumen = new PaginaResumen(page);
  const categorias = new PaginaCategorias(page);

  await ingreso.entrar();
  await resumen.registrar("Egreso", categoria, "320,00");
  await resumen.lista.expectFila(categoria, "Egreso", "320,00");
  await resumen.lista.eliminar(categoria);
  await categorias.eliminarVacia(categoria);
});

test("edita el monto de un movimiento", async ({ page }) => {
  const categoria = categoriaUnica("editar");
  const ingreso = new PaginaIngreso(page);
  const resumen = new PaginaResumen(page);
  const categorias = new PaginaCategorias(page);

  await ingreso.entrar();
  await resumen.registrar("Ingreso", categoria, "10,00");
  await resumen.editarMonto(categoria, "25,00");
  await resumen.lista.eliminar(categoria);
  await categorias.eliminarVacia(categoria);
});

test("busca un movimiento por su categoría", async ({ page }) => {
  const categoria = categoriaUnica("buscar");
  const ingreso = new PaginaIngreso(page);
  const resumen = new PaginaResumen(page);
  const movimientos = new PaginaMovimientos(page);
  const categorias = new PaginaCategorias(page);

  await ingreso.entrar();
  await resumen.registrar("Ingreso", categoria, "40,00");
  await movimientos.abrir();
  await movimientos.buscar(categoria);
  await movimientos.lista.expectFila(categoria);
  await movimientos.expectUnRegistro();
  await movimientos.buscar("sin-coincidencias");
  await movimientos.expectSinResultados();
  await movimientos.buscar(categoria);
  await movimientos.lista.eliminar(categoria);
  await categorias.eliminarVacia(categoria);
});

test("filtra el historial por tipo de movimiento", async ({ page }) => {
  const ingresoNombre = categoriaUnica("filtro-ingreso");
  const egresoNombre = categoriaUnica("filtro-egreso");
  const ingreso = new PaginaIngreso(page);
  const resumen = new PaginaResumen(page);
  const movimientos = new PaginaMovimientos(page);
  const categorias = new PaginaCategorias(page);

  await ingreso.entrar();
  await resumen.registrar("Ingreso", ingresoNombre, "11,00");
  await resumen.registrar("Egreso", egresoNombre, "12,00");
  await movimientos.abrir();
  await movimientos.lista.expectFila(ingresoNombre);
  await movimientos.lista.expectFila(egresoNombre);

  await movimientos.filtrar("Ingresos");
  await movimientos.lista.expectFila(ingresoNombre);
  await movimientos.lista.expectAusente(egresoNombre);

  await movimientos.filtrar("Egresos");
  await movimientos.lista.expectFila(egresoNombre);
  await movimientos.lista.expectAusente(ingresoNombre);

  await movimientos.filtrar("Todos");
  await movimientos.lista.eliminar(ingresoNombre);
  await movimientos.lista.eliminar(egresoNombre);
  await categorias.eliminarVacia(ingresoNombre);
  await categorias.eliminarVacia(egresoNombre);
});

test("exporta el historial en CSV", async ({ page }) => {
  const ingreso = new PaginaIngreso(page);
  const movimientos = new PaginaMovimientos(page);

  await ingreso.entrar();
  await movimientos.abrir();
  await movimientos.exportarCsv();
});

test("renombra una categoría creada con un ingreso", async ({ page }) => {
  const categoria = categoriaUnica("categoria");
  const nuevoNombre = categoriaUnica("renombre");
  const ingreso = new PaginaIngreso(page);
  const resumen = new PaginaResumen(page);
  const movimientos = new PaginaMovimientos(page);
  const categorias = new PaginaCategorias(page);

  await ingreso.entrar();
  await resumen.registrar("Ingreso", categoria, "18,00");
  await categorias.abrir();
  await categorias.renombrar(categoria, nuevoNombre);
  await movimientos.abrir();
  await movimientos.lista.eliminar(nuevoNombre);
  await categorias.abrir();
  await categorias.eliminar(nuevoNombre);
});

test("el asistente informa el balance del mes", async ({ page }) => {
  const ingreso = new PaginaIngreso(page);
  const asistente = new Asistente(page);

  await ingreso.entrar();
  await asistente.consultarBalance();
});

test("cierra la sesión y vuelve al ingreso", async ({ page }) => {
  const ingreso = new PaginaIngreso(page);
  const sesion = new Sesion(page);

  await ingreso.entrar();
  await sesion.cerrar();
  await ingreso.expectVisible();
  await ingreso.abrirDashboardSinSesion();
});
