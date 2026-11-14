# Fin Track

Fin Track lleva las finanzas de quien administra la cuenta. Después de iniciar sesión se abre el resumen del mes: el balance, el alta de ingresos y egresos, y los últimos movimientos.

La interfaz está en español y se usa en teléfono, tablet y escritorio. La tipografía de la app es JetBrains Mono. Es una PWA instalable (`standalone`): en Chrome aparece Instalar, y en iOS Safari se agrega a la pantalla de inicio. El service worker solo precachea el manifiesto y los iconos; login, movimientos y el resto de la API siguen pidiendo red.

## Qué se puede hacer

- Entrar con un usuario y una contraseña.
- Ver el balance del mes, y en tarjetas aparte el total de ingresos y el de egresos. El balance es ingresos menos egresos. El período puede ser este mes, el mes pasado o el año actual.
- Registrar, editar o borrar un ingreso o un egreso indicando monto, moneda, categoría, fecha e icono. La moneda por defecto del alta es la de visualización del navegador. La categoría se elige de las ya cargadas o queda en Sin categoría (opción por defecto); el icono solo se pide cuando la categoría es Sin categoría. Si la moneda no es el dólar y todavía no hay un cambio cargado, el administrador lo ingresa en el mismo formulario; el resto de los usuarios no puede guardar ese movimiento hasta que exista.
- Consultar el historial. En el resumen se ven como máximo cinco movimientos, con un enlace a la página completa. En el teléfono y en el escritorio cada movimiento es una fila: icono, categoría, tipo, fecha, monto y las acciones de editar y borrar. En Movimientos se puede buscar por monto o categoría y filtrar por tipo y por categoría. Junto al título, Importar abre un cuadro para bajar un Excel de formato y subir los movimientos, Exportar descarga todos los movimientos hasta hoy en CSV, Excel o PDF, y Nuevo abre el alta.
- Revisar las categorías. Junto al título hay un filtro de Todo, Egresos e Ingresos. Se puede cambiar el nombre y el icono, o borrar la categoría si no tiene movimientos. Un icono de ingreso se muestra en verde.
- Preguntar en lenguaje natural desde el asistente de la esquina inferior derecha. El modelo arma un reporte de totales en dólares, por categoría o por mes, de los últimos 24 meses como máximo, y la ventana lo muestra en markdown. Al proveedor solo llegan esos totales, nunca cada movimiento. Si el modelo no está configurado o no responde, el asistente sigue contestando el balance, los ingresos, los egresos, las categorías y los últimos movimientos del mes actual o del mes pasado.
- Ver estadísticas por día, mes, tres meses, seis meses o año. El período se elige junto al título.
- En Configuración, cambiar la contraseña propia, elegir tema claro, oscuro o el del sistema, y la moneda en la que se muestran los totales. Cada movimiento queda en su moneda. Los totales están en dólares y se convierten con el cambio cargado; si esa moneda no tiene cambio, los totales se ven en dólares. El dólar es la referencia: un cambio dice cuántas unidades de la otra moneda equivalen a 1 USD. Solo el administrador puede modificar los cambios y gestionar usuarios registrados (buscar, ver, editar roles y eliminar). El tema y la moneda de visualización quedan en el navegador.
- Cerrar la sesión desde el menú del usuario.

En escritorio el menú superior lista Resumen, Movimientos, Categorías, Estadísticas y Configuración. En el teléfono la barra inferior muestra las cuatro primeras y el botón para cargar un movimiento. Configuración, en esa pantalla, está en el menú de la sesión.

## Usuarios, roles y permisos

El acceso lo decide el backend. Al arrancar con la base conectada crea, si todavía no existe, el usuario de `ADMIN_USERNAME` y `ADMIN_PASSWORD` con el rol `admin`. La base le asigna un id numérico. La contraseña se guarda hasheada. Si la del entorno cambia, el arranque actualiza el hash.

Roles:

| Rol | Permisos |
| --- | --- |
| `admin` | `finance.read`, `finance.write`, `users.read`, `users.manage` |
| `user` | `finance.read`, `finance.write`, `users.read` |
| `viewer` | `finance.read` |

`finance.read` permite ver tipos, categorías, movimientos y cambios. `finance.write` permite crearlos, editarlos y borrarlos. `users.read` lista usuarios, roles y permisos. `users.manage` crea usuarios, cambia roles y elimina usuarios. El rol `user` se muestra como Usuario común y tiene todos los permisos salvo `users.manage`. Solo el rol `admin` puede cargar o cambiar una cotización. El usuario de `ADMIN_USERNAME` no puede quedar sin el rol `admin` ni eliminarse.

En el login, Crear cuenta registra un usuario común (`user`): puede ver y cargar sus movimientos, y no administra usuarios ni cotizaciones. El alta y el cambio de rol desde la API siguen pidiendo `users.manage`. Sin roles, ese alta deja al usuario como `viewer`.

## Cómo está armada

Este directorio es un monorepo: reúne frontend, backend y Compose en un solo repositorio Git.

| Parte | Carpeta | Rol |
| --- | --- | --- |
| Frontend | `fin-track-v2-frontend` | Next.js. Login, resumen, movimientos, categorías, estadísticas y configuración. |
| Backend | `fin-track-v2-backend` | NestJS. Autenticación, usuarios, permisos, finanzas y acceso a la base. |
| Base de datos | servicio `db` de Compose | PostgreSQL 16. El esquema lo aplican las migraciones del backend al arrancar. |

El frontend no compara la contraseña. Pide los tokens al backend y los guarda en cookies `httpOnly` llamadas `access_token` y `refresh_token`. La raíz `/` redirige a `/login`. Con una sesión válida, `/login` lleva al resumen.

Los movimientos quedan en tres tablas:

- `tipos_transaccion`: ingreso y egreso.
- `categorias`: una categoría pertenece a un usuario y a un tipo.
- `transacciones`: monto, moneda, cambio aplicado, fecha, categoría y tipo.
- `cotizaciones`: cuántas unidades de una moneda equivalen a 1 USD. El dólar no tiene fila.

Los identificadores de usuarios, categorías, movimientos y cotizaciones son enteros que asigna la base. Los usuarios quedan en `usuarios`, `roles`, `permisos` y las tablas de unión `usuario_roles` y `rol_permisos`.

Las rutas de finanzas son `GET /tipos-transaccion`, `GET /categorias?tipo=`, `PATCH /categorias/:id`, `DELETE /categorias/:id`, `GET /cotizaciones`, `PUT /cotizaciones/:moneda`, `GET /transacciones?mes=YYYY-MM`, `GET /transacciones/importar/plantilla`, `POST /transacciones/importar`, `GET /transacciones/exportar/:formato` y `POST`, `PATCH` y `DELETE` de `/transacciones`. Con `desde` y `hasta` (`YYYY-MM-DD`), el listado devuelve ese rango. `:formato` es `csv`, `excel` o `pdf`; la respuesta es el archivo `movimientos.csv`, `movimientos.xlsx` o `movimientos.pdf` con todos los movimientos del usuario desde el 1 de enero de 1970 hasta hoy. Otro formato responde 400. El cuerpo de un movimiento lleva `tipo` (`ingreso` o `egreso`), `monto`, `moneda` (`ARS`, `USD`, `EUR`, `BRL`, `CLP` o `UYU`), `categoria`, `fecha` y, si corresponde, `icono`. El resumen guarda en cada movimiento el cambio vigente y expresa `balance`, `ingresos` y `egresos` en dólares. `GET /transacciones/importar/plantilla` y `POST /transacciones/importar` piden `finance.write`. La plantilla es `formato-movimientos.xlsx`, con las columnas Fecha, Tipo, Moneda y Monto en la hoja Movimientos. No incluye categoría. El archivo se valida entero: si una fila no cumple el formato, no se guarda ninguna. Las filas válidas se crean en la categoría Importado, con el cambio que ya esté cargado para esa moneda. `GET /cotizaciones` pide `finance.read`. `PUT /cotizaciones/:moneda` recibe `{ "valor" }` y solo lo acepta el rol `admin`; el dólar responde 400. El resumen mensual usa el mes actual de `America/Argentina/Buenos_Aires` cuando se omite `mes`. No se borra una categoría que tenga movimientos, ni se guarda un nombre repetido para el mismo usuario y tipo: ambos casos responden 409.

`POST /auth/signup` es público y recibe `username` y `password`. Crea un usuario con el rol `user` e inicia sesión desde el login. El resto de las rutas de usuarios están autenticadas: `GET /usuarios`, `POST /usuarios`, `PATCH /usuarios/:id`, `DELETE /usuarios/:id`, `GET /roles` y `GET /permisos`. El alta autenticada lleva `username`, `password` y, opcionalmente, `roles`. Sin roles, el usuario queda como `viewer`. `PATCH` recibe `{ "roles": ["viewer"] }`. `DELETE` responde 204 y rechaza borrarte a vos, al admin inicial o a un usuario con movimientos o categorías. `GET /auth/me` devuelve `username`, `roles` y `permissions`.

Los nombres de los métodos del backend están en inglés. Las rutas y los campos del JSON siguen en español.

## Cómo levantarla

Desde este directorio:

```bash
make up
```

Eso construye y arranca los servicios. `make be` levanta solo el backend y PostgreSQL. `make down` los detiene y `make logs` sigue sus registros.

| Servicio | Dirección local |
| --- | --- |
| Frontend | http://localhost:3010 |
| Backend | http://localhost:4010 |
| Swagger (API) | http://localhost:4010/api |
| PostgreSQL | localhost:5432 |
| Túnel de ngrok | La URL pública sale en los logs de `ngrok` y en http://localhost:4050 |

Dentro de Compose, el frontend llama al backend por `http://backend:3001` y el backend se conecta a la base por el servicio `db`. La base de desarrollo usa el usuario, la contraseña y el nombre `fintrack`.

`ngrok` publica solo el frontend. El authtoken y el dominio van en `.env.ngrok` (`NGROK_AUTHTOKEN` y `NGROK_DOMAIN`), copiado desde `.env.ngrok.example`. Ese archivo no se versiona, y Compose lo lee con `--env-file` para armar `--url`. Dentro de la red el túnel entra a `http://frontend:3000`. El backend y PostgreSQL no salen por el túnel. La URL queda en `docker compose logs ngrok` y en http://localhost:4050.

Los refresh tokens viven en PostgreSQL, así que un reinicio o varias instancias del backend siguen pudiendo renovar la sesión.

## Despliegue

El backend también puede ir a Vercel como Function: en `fin-track-v2-backend`, `api/index.ts` monta Nest sobre Express y exporta el handler `(req, res)`; `vercel.json` reescribe el tráfico a esa entrada. El Root Directory del proyecto tiene que ser `fin-track-v2-backend`. Las variables (`DATABASE_*`, `JWT_SECRET`, etc.) se cargan en el panel de Vercel; `.env.prod` no se sube.

`make deploy` copia esta carpeta a un servidor propio, incluido `.env.ngrok`, reconstruye las imágenes de frontend y backend (`docker compose build --pull`) y vuelve a crear sus contenedores, también el de ngrok. Renueva los volúmenes de `node_modules` y `.next`, y conserva el de PostgreSQL. El servidor necesita OpenSSH, Docker con el plugin Compose, y un usuario que pueda usar `docker`. La primera vez el comando solo crea la clave.

1. Copiá `.env.deploy.example` a `.env.deploy` y completá `DEPLOY_HOST` y `DEPLOY_USER`. `DEPLOY_PORT` es 22 si no se indica. El destino remoto es `~/apps/fin-track`; `REMOTE_DIR` lo cambia, siempre como ruta relativa al home.
2. Ejecutá `make deploy`. Si no existe `scripts/deploy/id_ed25519`, el comando la crea sin frase de paso y muestra la clave pública. Esa clave queda solo en esta máquina.
3. En el servidor, agregá la línea pública a `~/.ssh/authorized_keys` del usuario de `DEPLOY_USER`. El comando imprime los pasos.
4. Volvé a ejecutar `make deploy`. Entra por SSH, copia los archivos (incluidos los `.env` de cada proyecto y `.env.ngrok`) y levanta frontend, backend, PostgreSQL y ngrok. Termina cuando los cuatro están en marcha.

Los puertos publicados son 3010 para el frontend, 4010 para el backend y 5432 para PostgreSQL. `.env.deploy` y `scripts/deploy/` no se copian al servidor.

## Variables de entorno

El frontend lee `BACKEND_URL`. En local apunta a `http://localhost:3001`.

El backend lee:

- `ADMIN_USERNAME` y `ADMIN_PASSWORD`, el administrador inicial.
- `JWT_SECRET`, de al menos 32 bytes, para firmar el access token.
- `CORS_ORIGIN`, orígenes del navegador permitidos para la API (separados por coma). Por defecto `http://localhost:3010`.
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD` y `DATABASE_NAME`.
- `OBSERVE_APP_KEY` y `OBSERVE_APP_SECRET`, el par de NestJS Observe.
- `LLM_API_KEY`, `LLM_BASE_URL` y `LLM_MODEL`. Con las tres, `POST /asistente/chat` llama a un chat compatible con OpenAI (por defecto Groq y `openai/gpt-oss-120b`). Cambiar de proveedor es cambiar esas tres variables. Sin clave, o si el proveedor falla, el asistente usa las respuestas locales. Un 429 se muestra como “El asistente está ocupado, intenta en un minuto.”

Esas variables viven en el `.env` de cada proyecto y no se versionan. Copiá `.env.example` en cada carpeta y `.env.ngrok.example` / `.env.deploy.example` en la raíz. Compose sobreescribe las de la base para que el backend use el servicio `db`. El token del túnel vive en `.env.ngrok`, como `NGROK_AUTHTOKEN`. Si publicás el repo o filtraste un entorno, regenerá las claves según `SECRETS.md`.

## Desarrollo por separado

Cada proyecto usa Yarn 1.22.22.

```bash
cd fin-track-v2-frontend
yarn dev
yarn playwright install chromium
yarn test:e2e

cd fin-track-v2-backend
yarn start:dev
yarn test
yarn test:e2e
```

El frontend espera el backend en `BACKEND_URL`. El backend, fuera de Compose, espera PostgreSQL según su `.env`; en local el host es `localhost`. Los tests del backend no abren una conexión real a la base: con `VITEST=true` la conexión queda en `manualInitialization` y el login de prueba usa el administrador del entorno.
