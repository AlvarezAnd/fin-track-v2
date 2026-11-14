# Fin Track API

API de Fin Track. Autentica usuarios, aplica roles y permisos, y guarda categorías y movimientos en PostgreSQL. La descripción del producto y el arranque con Compose están en el `README.md` del directorio padre.

NestJS 12, ESM. Los imports relativos terminan en `.js`. Los métodos están en inglés. Las rutas y los campos del JSON siguen en español.

## Arranque

Hace falta Node 22 y Yarn 1.22.22. Copiá `.env.example` a `.env`. Fuera de Compose, PostgreSQL tiene que estar accesible con esas variables.

```bash
yarn install
yarn start:dev
```

`yarn start` arranca una vez. `yarn start:prod` corre el build de `yarn build`.

Con el proceso en marcha, la documentación OpenAPI (Swagger UI) está en `/api` y el JSON en `/api-json`. En local: http://localhost:3001/api (o http://localhost:4010/api con Compose). En Authorize pegá el `access_token` de `POST /auth/token`.

## Variables

- `ADMIN_USERNAME` y `ADMIN_PASSWORD`: administrador inicial. Con la base conectada se guarda con un id numérico y el rol `admin`.
- `JWT_SECRET`: al menos 32 bytes.
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`.
- `CORS_ORIGIN`: orígenes del navegador permitidos para llamar a la API (lista separada por comas: esquema + host + puerto). Sin la variable, solo `http://localhost:3010`. No afecta a clientes sin navegador ni a llamadas same-origin.
- `OBSERVE_APP_KEY` y `OBSERVE_APP_SECRET`: NestJS Observe. `npx @nestjs/observe link` los escribe en `.env`.
- `LLM_API_KEY`, `LLM_BASE_URL` y `LLM_MODEL`: chat compatible con OpenAI. El valor de desarrollo es `https://api.groq.com/openai/v1` y `openai/gpt-oss-120b`. La clave queda vacía hasta configurarla.

## Base de datos

`synchronize` está apagado. Al arrancar, TypeORM ejecuta las migraciones pendientes de `src/database/migrations`. La inicial crea `tipos_transaccion`, `categorias`, `transacciones`, `usuarios`, `roles`, `permisos`, `usuario_roles` y `rol_permisos`, con el índice único `categorias_usuario_tipo_nombre`. La siguiente pasa los ids a enteros incrementales, agrega `moneda` y `cotizacion` en `transacciones`, y crea `cotizaciones`. Otra crea `tokens_refresco` y `tokens_refresco_revocaciones` para los refresh tokens.

```bash
yarn migration:show
yarn migration:run
yarn migration:revert
```

Esos comandos compilan antes de conectarse. Para generar la siguiente migración, después de cambiar una entidad:

```bash
yarn build
node ./node_modules/typeorm/cli.js migration:generate src/database/migrations/Nombre -d dist/database/data-source.js
```

La clase generada se agrega al arreglo `migrations` de `src/database/typeorm.config.ts`.

Si la base ya tiene las tablas y no existe la tabla `migrations`, el arranque intenta crearlas otra vez y falla. Hay que recrear la base vacía, o registrar la migración inicial como ejecutada.

## Acceso

`POST /auth/signup` es público, recibe `username` y `password`, y crea un usuario con el rol `user`. `POST /auth/token` recibe `username` y `password` y devuelve `access_token`, `refresh_token` y `expires_in`. `POST /auth/token/refresh` rota el refresh token. `POST /auth/token/revoke` lo revoca. Los refresh tokens se guardan en PostgreSQL (`tokens_refresco` / `tokens_refresco_revocaciones`), así sobreviven reinicios y varias instancias.

`GET /auth/me` devuelve `username`, `roles` y `permissions`. `PATCH /auth/contrasena` lo puede llamar cualquier usuario autenticado. Recibe `actual` y `nueva`, toma el id de la sesión y responde 204. La contraseña actual incorrecta responde 400. Sin base responde 503.

Permisos: `finance.read`, `finance.write`, `users.read`, `users.manage`. El rol `admin` tiene los cuatro. El rol `user` (Usuario común) tiene todos salvo `users.manage`. El rol `viewer` tiene `finance.read`. Solo `admin` puede modificar cotizaciones.

| Método y ruta | Permiso | Cuerpo o consulta |
| --- | --- | --- |
| `GET /tipos-transaccion` | `finance.read` | |
| `GET /categorias` | `finance.read` | `tipo` |
| `PATCH /categorias/:id` | `finance.write` | `nombre` y/o `icono`. 409 si el nombre ya existe para ese usuario y tipo |
| `DELETE /categorias/:id` | `finance.write` | 409 si tiene movimientos |
| `GET /cotizaciones` | `finance.read` | |
| `PUT /cotizaciones/:moneda` | rol `admin` | `{ "valor" }`. Unidades de esa moneda por 1 USD. `USD` responde 400 |
| `GET /transacciones` | `finance.read` | `mes=YYYY-MM`, o `desde` y `hasta` |
| `GET /transacciones/importar/plantilla` | `finance.write` | Responde `formato-movimientos.xlsx`. Columnas Fecha, Tipo, Moneda y Monto |
| `POST /transacciones/importar` | `finance.write` | El archivo `.xlsx` en el cuerpo. 400 con `errores` si el formato o alguna celda no es válido; no guarda nada. Cada fila queda en la categoría Importado |
| `GET /transacciones/exportar/:formato` | `finance.read` | `csv`, `excel` o `pdf`. Responde el archivo `movimientos.csv`, `movimientos.xlsx` o `movimientos.pdf` con los movimientos desde `1970-01-01` hasta hoy. Otro formato responde 400 |
| `POST /transacciones` | `finance.write` | `tipo`, `monto`, `moneda`, `categoria`, `fecha`, `icono` opcional |
| `PATCH /transacciones/:id` | `finance.write` | el mismo cuerpo |
| `DELETE /transacciones/:id` | `finance.write` | |
| `GET /usuarios` | `users.read` | |
| `POST /usuarios` | `users.manage` | `username`, `password`, `roles` opcional |
| `PATCH /usuarios/:id` | `users.manage` | `roles` |
| `GET /roles` | `users.read` | |
| `GET /permisos` | `users.read` | |
| `PATCH /auth/contrasena` | sesión | `{ "actual", "nueva" }`. 204. 400 si la actual no coincide |
| `POST /asistente/chat` | `finance.read` | `{ "messages": [{ "role", "content" }] }`. Responde `{ "respuesta" }` o `{ "fallback": true }` |

`POST /asistente/chat` toma el usuario de la sesión. La herramienta `reporte_movimientos` agrupa totales en dólares por categoría o por mes, como máximo 24 meses, y eso es lo único que vuelve al modelo. Un 429 responde “El asistente está ocupado, intenta en un minuto.” Sin las variables del modelo, o si el proveedor falla, la respuesta es `{ "fallback": true }`.

Sin `roles`, el usuario nuevo queda como `viewer`. El usuario de `ADMIN_USERNAME` conserva el rol `admin`. Las respuestas de usuarios no incluyen el hash de la contraseña. Los ids de las respuestas son números. El resumen convierte los totales a dólares con la cotización guardada en el movimiento.

Los montos aceptan hasta dos decimales, también `1.250,50`. Si se omite `mes`, el resumen usa el mes actual de `America/Argentina/Buenos_Aires`.

## Tests

Las pruebas viven en `tests/`. Las unitarias repiten la estructura de `src/` (`*.spec.ts`); las e2e son `*.e2e-spec.ts`.

```bash
yarn test
yarn test:e2e
```

Vitest define `VITEST=true`. La conexión usa `manualInitialization`, así que los tests no necesitan PostgreSQL. En ese modo el login compara las credenciales del entorno.

## Observe

El proceso informa trazas, errores, logs y métricas a [NestJS Observe](https://observe.nestjs.com) mediante `ObserveModule`. En local, `npx @nestjs/observe link` escribe el par de claves. En producción, definí `OBSERVE_APP_KEY` y `OBSERVE_APP_SECRET` en el entorno.
