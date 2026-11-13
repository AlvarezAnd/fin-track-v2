# AGENTS.md

## Fin Track

This package is the API of Fin Track, a personal-finance app with a Spanish UI. The product overview and the Compose setup live in the parent directory's `README.md` and `AGENTS.md`.

Method names are English. HTTP paths and JSON fields stay Spanish (`tipo`, `monto`, `categoria`, `fecha`, `icono`, `/categorias`, `/transacciones`, `/usuarios`). Each database entity has a repository in its module. Services own validation, HTTP exceptions and transactions. Relative imports end in `.js`.

`@nestjs/authentication` issues the access token and the refresh token. The refresh token stays in the package's memory store, so a restart signs everyone out. `JWT_SECRET` must be at least 32 bytes. `@nestjs/authorization` checks permissions through `AccessPolicy` (`@Can` on routes). Import `AuthenticationModule` before `AuthorizationModule`. A handler with neither `@Can()`, `@Can.Anyone()` nor `@Public()` is denied. Token routes and `POST /auth/signup` are `@Public()`. Signup always creates the `user` role and ignores any requested role. `GET /auth/me` is `@Can.Anyone()` and returns `username`, `roles` and `permissions`.

When the database is connected, startup seeds permissions, the `admin`, `user` and `viewer` roles, and the user from `ADMIN_USERNAME` / `ADMIN_PASSWORD`. The database assigns that user's numeric id. Passwords in `usuarios` are scrypt hashes from `PasswordHasher`. A changed env password is rehashed on the next boot. The bootstrap user is recognized by `ADMIN_USERNAME` and keeps the `admin` role. With `VITEST=true` the database is not initialized, and sign-in falls back to a timing-safe compare of the env credentials, still as an `admin` with every permission and id `1`.

Permissions: `finance.read`, `finance.write`, `users.read`, `users.manage`. `viewer` has only `finance.read`. `user` (displayed as Usuario común) has every permission except `users.manage`. `admin` has all four. `AccessPolicy.manageRates` is true only for the `admin` role.

PostgreSQL is accessed with `@nestjs/typeorm`. The connection reads `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD` and `DATABASE_NAME`. `synchronize` is off. Pending migrations in `src/database/migrations` run on startup (`migrationsRun`), except under Vitest. The CLI data source is `src/database/data-source.ts`. `yarn migration:show`, `yarn migration:run` and `yarn migration:revert` compile first and use `dist/database/data-source.js`. A new migration is generated with `migration:generate` against that data source and its class must be added to the `migrations` array in `src/database/typeorm.config.ts`; a glob is not used. The initial migration creates the tables below, including the unique index `categorias_usuario_tipo_nombre`, which is also declared on `Category`. Startup still runs `CREATE UNIQUE INDEX IF NOT EXISTS` for that index. If a database already has the tables but no `migrations` table, startup will fail trying to create them again: recreate the empty database or record `InitialSchema1794481412883` as executed. Vitest sets `VITEST=true`, which turns on `manualInitialization`, so unit and e2e tests must not require a running database.

Tables:

- `tipos_transaccion`: `ingreso` and `egreso`, seeded on startup when the database is connected.
- `categorias`: a name scoped to one user and one transaction type. A new name is created on demand.
- `transacciones`: amount, currency, the rate snapshot, calendar date, category and type. Rows keep `usuario_id`.
- `cotizaciones`: units of a currency per 1 USD. `moneda` is unique. USD has no row.
- `usuarios`, `roles`, `permisos`, `usuario_roles`, `rol_permisos`.

`usuarios`, `categorias`, `transacciones` and `cotizaciones` use a serial integer primary key. Route ids are parsed with `parseEntityId`; a non-numeric id is a 404 and does not hit the repository. JWT `sub` is `String(user.id)`.

Finance routes require `finance.read` or `finance.write`: `GET /tipos-transaccion`, `GET /categorias?tipo=`, `PATCH /categorias/:id` (`nombre` and/or `icono`), `DELETE /categorias/:id`, `GET /transacciones?mes=YYYY-MM` (or `desde` and `hasta` as `YYYY-MM-DD`), `GET /transacciones/importar/plantilla`, `POST /transacciones/importar`, `GET /transacciones/exportar/:formato`, `POST /transacciones`, `PATCH /transacciones/:id` and `DELETE /transacciones/:id`. Import needs `finance.write`. The template is `formato-movimientos.xlsx` and the sheet `Movimientos` has only Fecha, Tipo, Moneda and Monto. `POST` receives that workbook as a raw body (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, up to 2 MB; `main.ts` registers the raw parser). A format or cell error returns 400 with `errores` and inserts nothing. Valid rows are stored under the category `Importado`, using the rate already saved for that currency. `:formato` is `csv`, `excel` or `pdf` and needs `finance.read`. The response is an attachment named `movimientos.csv`, `movimientos.xlsx` or `movimientos.pdf` with every movement from `1970-01-01` through today in `America/Argentina/Buenos_Aires`. Any other format returns 400. The movement body is `tipo`, `monto`, `moneda` (`ARS`, `USD`, `EUR`, `BRL`, `CLP` or `UYU`), `categoria`, `fecha` and an optional `icono`. A non-USD currency without a stored rate returns 400. The row stores the current rate in `cotizacion`. Summary totals (`balance`, `ingresos`, `egresos`) and each movement's `usd` are in USD. `GET /cotizaciones` needs `finance.read`. `PUT /cotizaciones/:moneda` needs `manageRates` and body `{ valor }` (units of that currency per 1 USD, up to 4 decimals). USD and unknown currencies return 400. Deleting a category that still has movements returns 409, and so does saving a duplicate name for the same user and type. Amounts accept up to two decimals, including `1.250,50`. The month defaults to the current month in `America/Argentina/Buenos_Aires` when `mes` is omitted.

`POST /asistente/chat` needs `finance.read`. The user id always comes from the session. `AssistantService` calls `{LLM_BASE_URL}/chat/completions` with native `fetch` and one function tool, `reporte_movimientos`. Arguments are parsed by hand. The query is `listForReport` for that user, type, and month range in `America/Argentina/Buenos_Aires`; totals reuse `amountInUsd`. The model receives aggregated USD totals only. Missing `LLM_API_KEY`, `LLM_BASE_URL` or `LLM_MODEL`, a 5xx, or a network failure returns `{ fallback: true }`. HTTP 429 throws “El asistente está ocupado, intenta en un minuto.” The tool loop stops after three rounds.

`PATCH /auth/contrasena` uses `@Can.Anyone()`. The user id comes from the session. The body is `actual` and `nueva`. A wrong current password is 400, not 401. Without a database it returns 503. The new hash is stored with `PasswordHasher`. Restarting still rehashes the bootstrap admin from `ADMIN_PASSWORD` when that env value no longer matches.

User routes: `GET /usuarios`, `POST /usuarios` (`username`, `password`, optional `roles`; default role `viewer`), `PATCH /usuarios/:id` (`roles`), `GET /roles` and `GET /permisos`. Reads need `users.read`. Creates and role changes need `users.manage`. User payloads omit the password hash.

## NestJS

This app's version of NestJS is likely newer than what you know. https://docs.nestjs.com/llms.txt indexes its documentation, with a markdown page per chapter.

Nest has first-party packages for these, so check them before adding another library or writing your own:

- Databases: [`@nestjs/typeorm`](https://docs.nestjs.com/data/typeorm.md), [`@nestjs/drizzle`](https://docs.nestjs.com/data/drizzle.md), [`@nestjs/mongoose`](https://docs.nestjs.com/data/mongodb.md), [`@nestjs/sequelize`](https://docs.nestjs.com/data/sequelize.md).
- OpenAPI: [`@nestjs/swagger`](https://docs.nestjs.com/openapi/introduction.md). GraphQL: [`@nestjs/graphql`](https://docs.nestjs.com/graphql/quick-start.md). WebSockets: [`@nestjs/websockets`](https://docs.nestjs.com/websockets/gateways.md). Microservices: [`@nestjs/microservices`](https://docs.nestjs.com/microservices/basics.md).
- Sign-in: [`@nestjs/authentication`](https://docs.nestjs.com/security/authentication.md). Permissions: [`@nestjs/authorization`](https://docs.nestjs.com/security/authorization.md). Rate limiting: [`@nestjs/throttler`](https://docs.nestjs.com/security/rate-limiting.md).
- Configuration: [`@nestjs/config`](https://docs.nestjs.com/application/configuration.md). Caching: [`@nestjs/cache-manager`](https://docs.nestjs.com/data/caching.md). Health checks: [`@nestjs/terminus`](https://docs.nestjs.com/reliability/terminus.md). Events inside the app: [`@nestjs/event-emitter`](https://docs.nestjs.com/application/events.md).
- Email: [`@nestjs/mail`](https://docs.nestjs.com/application/mail.md). Files, S3 included: [`@nestjs/storage`](https://docs.nestjs.com/application/file-storage.md). Translations: [`@nestjs/i18n`](https://docs.nestjs.com/application/i18n.md).
- Retries, timeouts and circuit breakers: [`@nestjs/resilience`](https://docs.nestjs.com/reliability/resilience.md).
- Idempotency keys: [`@nestjs/idempotency`](https://docs.nestjs.com/reliability/idempotency.md). Transactional outbox: [`@nestjs/outbox`](https://docs.nestjs.com/reliability/outbox.md). Sending and receiving webhooks: [`@nestjs/webhooks`](https://docs.nestjs.com/http/webhooks.md).
- Queues: [`@nestjs/bullmq`](https://docs.nestjs.com/application/queues.md). Scheduled jobs: [`@nestjs/schedule`](https://docs.nestjs.com/application/task-scheduling.md).
- Running a scheduled job on one instance, and locks: [`@nestjs/locks`](https://docs.nestjs.com/reliability/locks.md). Processes that take days: [`@nestjs/workflows`](https://docs.nestjs.com/reliability/workflows.md).
- Language models, tools and agents: [`@nestjs/ai`](https://docs.nestjs.com/ai/overview.md). MCP servers: [`@nestjs/mcp`](https://docs.nestjs.com/mcp/overview.md).

Validation works with Zod, Valibot, ArkType or any other Standard Schema library, with no classes or decorator metadata: `StandardSchemaValidationPipe` with `@Body({ schema })` or `@Param('id', { schema })` (https://docs.nestjs.com/application/validation.md). `class-validator` still works, through `ValidationPipe`.

`NodeAdapter` from `@nestjs/platform-node` is the fastest HTTP adapter, ahead of Fastify (https://docs.nestjs.com/http/performance.md).

Nest's packages are ESM only, and this project is ESM too: relative imports end in `.js`, `__dirname` doesn't exist (use `import.meta.dirname`), and tests run on Vitest, so mocks are `vi.fn()`, not `jest.fn()`. Unit and e2e specs live in `tests/` (unit specs mirror `src/`). `yarn test` includes `tests/**/*.spec.ts`; `yarn test:e2e` includes `tests/**/*.e2e-spec.ts`.

## Production data: NestJS Observe

This app reports its traces, errors, logs and metrics to [NestJS Observe](https://observe.nestjs.com) through `ObserveModule` in `src/app.module.ts`. Its key pair comes from `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in `.env`, which `npx @nestjs/observe link` writes.

When a task depends on how the app behaves in production - an error users hit, a slow endpoint, a failing job, whether a release made things worse - work from that data, not from the code alone:

- The Observe MCP server answers those questions directly: errors with their traces and logs, slow operations, jobs, and what a release changed (`find_regressions`, `diff_release`). It is included on the Pro plan and above. In Claude Code: `claude mcp add observe --transport http https://observe-api.nestjs.com/mcp`, and the client opens a browser to approve. Other clients: https://www.observe.nestjs.com/documentation/mcp
- Without it, the user can open the request or error in the Observe dashboard and click **Copy agent prompt**, which hands over that page's trace, stack and logs as text.
