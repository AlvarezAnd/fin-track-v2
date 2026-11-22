# Fin Track

Cliente web de Fin Track. Login, resumen, movimientos, categorías, estadísticas y configuración, en español. El producto completo y el arranque con Compose están en el `README.md` del directorio padre.

Next.js 16, React 19 y Tailwind 4. El paquete usa Yarn 1.22.22.

## Arranque

```bash
yarn install
yarn dev
```

Copiá `.env.example` a `.env`. La app queda en http://localhost:3000 (o el puerto de Compose, 3010). Necesita el backend en `BACKEND_URL`. Fuera de Compose, el ejemplo usa `http://localhost:4010`. Dentro de Compose, `http://backend:3001`.

Al ingresar, al cambiar de sección y al cargar los datos de cada pantalla se muestra un spinner. Al cambiar de sección el spinner cubre solo el contenido: la cabecera, el sidebar o la barra inferior y el botón del asistente se mantienen visibles y se pueden usar mientras carga.

## Pantallas

| Ruta | Qué muestra |
| --- | --- |
| `/login` | Usuario y contraseña, o alta de una cuenta común. |
| `/dashboard` | Balance del período, alta de ingreso y egreso, totales y los últimos cinco movimientos. |
| `/dashboard/movimientos` | Historial, búsqueda y filtro por tipo y categoría. Junto al título, Importar baja el formato en Excel o CSV y sube el `.xlsx` o `.csv` completado, Nuevo abre el alta y Exportar descarga todos los movimientos hasta hoy en CSV, Excel o PDF. |
| `/dashboard/categorias` | Categorías filtradas por Todo, Egresos o Ingresos. El nombre y el icono se editan; se borra si no tiene movimientos. |
| `/dashboard/estadisticas` | Totales y gráficos por día, mes, tres meses, seis meses o año. El período está junto al título. |
| `/dashboard/configuracion` | Cambio de la contraseña propia, tema claro, oscuro o el del sistema, moneda de visualización y cambios. Solo el administrador guarda un cambio y gestiona usuarios (buscador, tabla, ver / editar roles / eliminar). |

`/` redirige a `/login` desde `next.config.ts`. Con sesión, `/login` sigue hacia el resumen.

En escritorio la navegación va en un sidebar a la izquierda (las cinco secciones); la cabecera queda para la sesión. En el teléfono la barra inferior muestra las cuatro primeras y el botón de alta. Configuración está en el menú de la sesión. En escritorio el historial muestra categoría, tipo, fecha, monto y acciones. En el teléfono muestra tipo, monto y un menú de tres puntos. El asistente, abajo a la derecha, envía el historial a `POST /api/asistente/chat` y muestra la respuesta en markdown. Si el backend pide el respaldo, responde con los registros del mes actual o del mes pasado.

## Sesión y preferencias

El navegador no ve la contraseña. `access_token` y `refresh_token` son cookies `httpOnly`. Un access token vencido se renueva con `GET /api/auth/refresh` antes de seguir, porque un componente de servidor no puede guardar la cookie nueva.

El tema se guarda en `localStorage` con la clave `theme`: `light`, `dark` o `system`. Si no hay valor, o si es `system`, la pantalla sigue el color del dispositivo. La moneda de visualización queda en `fin-track-preferencias` y arranca en pesos. Los totales de la API están en dólares, pero la pantalla los calcula desde los movimientos en la moneda visible: usa el monto exacto si coincide y convierte los demás con el cambio guardado en cada uno. Así un ingreso de $1.650.000 no cambia por redondeo. Cada movimiento se muestra en su propia moneda. Al registrarlo se elige la moneda; si no hay cambio, el administrador lo carga en el mismo formulario. El resto ve el aviso y no puede guardar esa moneda hasta que exista.

La tipografía es JetBrains Mono.

## PWA

La app se puede instalar. El manifiesto está en `src/app/manifest.ts` y los iconos en `public/`. El service worker (`public/sw.js`) se registra desde el layout y solo guarda el manifiesto y los iconos. Login, movimientos y el resto de la API necesitan red. En Chrome (escritorio o Android) aparece Instalar; en iOS Safari usá Compartir → Agregar a pantalla de inicio. Hace falta HTTPS (el túnel de ngrok) o localhost.

## Pruebas

Las pruebas de interfaz usan Playwright y Chromium. La primera vez hay que bajar el navegador:

```bash
yarn playwright install chromium
yarn test:e2e
```

Los archivos viven en `e2e/`. Si la app ya está en http://localhost:3000, Playwright la reutiliza. Si no, `yarn test:e2e` levanta `yarn dev`.
