import { MigrationInterface, QueryRunner } from 'typeorm';

export class NumericIdsAndExchangeRates1794482600446 implements MigrationInterface {
  name = 'NumericIdsAndExchangeRates1794482600446';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "cotizaciones" (
        "id" SERIAL NOT NULL,
        "moneda" character varying(3) NOT NULL,
        "valor" numeric(14,4) NOT NULL,
        CONSTRAINT "UQ_ce03352017884c14ee5cc6a0b6f" UNIQUE ("moneda"),
        CONSTRAINT "PK_4fcc685d6bca9b3a997ba9cd3bc" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "transacciones" ADD "moneda" character varying(3) NOT NULL DEFAULT 'ARS'`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacciones" ADD "cotizacion" numeric(14,4)`,
    );
    await queryRunner.query(`ALTER TABLE "usuarios" ADD "id_num" integer`);
    await queryRunner.query(`ALTER TABLE "categorias" ADD "id_num" integer`);
    await queryRunner.query(`ALTER TABLE "categorias" ADD "usuario_num" integer`);
    await queryRunner.query(`ALTER TABLE "transacciones" ADD "id_num" integer`);
    await queryRunner.query(`ALTER TABLE "transacciones" ADD "usuario_num" integer`);
    await queryRunner.query(`ALTER TABLE "transacciones" ADD "categoria_num" integer`);
    await queryRunner.query(`ALTER TABLE "usuario_roles" ADD "usuario_num" integer`);
    await queryRunner.query(`
      WITH ranked AS (
        SELECT "id", row_number() OVER (ORDER BY "username", "id")::integer AS n
        FROM "usuarios"
      )
      UPDATE "usuarios" AS usuario
      SET "id_num" = ranked.n
      FROM ranked
      WHERE usuario."id" = ranked."id"
    `);
    await queryRunner.query(`
      WITH ranked AS (
        SELECT "id", row_number() OVER (ORDER BY "nombre", "id")::integer AS n
        FROM "categorias"
      )
      UPDATE "categorias" AS categoria
      SET "id_num" = ranked.n
      FROM ranked
      WHERE categoria."id" = ranked."id"
    `);
    await queryRunner.query(`
      UPDATE "categorias" AS categoria
      SET "usuario_num" = usuario."id_num"
      FROM "usuarios" AS usuario
      WHERE categoria."usuario_id" = usuario."id"
    `);
    await queryRunner.query(`
      WITH ranked AS (
        SELECT "id", row_number() OVER (ORDER BY "fecha", "creado_en", "id")::integer AS n
        FROM "transacciones"
      )
      UPDATE "transacciones" AS movimiento
      SET "id_num" = ranked.n
      FROM ranked
      WHERE movimiento."id" = ranked."id"
    `);
    await queryRunner.query(`
      UPDATE "transacciones" AS movimiento
      SET "usuario_num" = usuario."id_num"
      FROM "usuarios" AS usuario
      WHERE movimiento."usuario_id" = usuario."id"
    `);
    await queryRunner.query(`
      UPDATE "transacciones" AS movimiento
      SET "categoria_num" = categoria."id_num"
      FROM "categorias" AS categoria
      WHERE movimiento."categoria_id" = categoria."id"
    `);
    await queryRunner.query(`
      UPDATE "usuario_roles" AS asignacion
      SET "usuario_num" = usuario."id_num"
      FROM "usuarios" AS usuario
      WHERE asignacion."usuario_id" = usuario."id"
    `);
    await queryRunner.query(
      `ALTER TABLE "transacciones" DROP CONSTRAINT "FK_deddbcadce68c9bacb42b3eb675"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuario_roles" DROP CONSTRAINT "FK_f4660653ecea0eef621bae52097"`,
    );
    await queryRunner.query(`DROP INDEX "public"."categorias_usuario_tipo_nombre"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f4660653ecea0eef621bae5209"`);
    await queryRunner.query(
      `ALTER TABLE "usuario_roles" DROP CONSTRAINT "PK_c61154df0793c9383ea2bafc22d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categorias" DROP CONSTRAINT "PK_3886a26251605c571c6b4f861fe"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacciones" DROP CONSTRAINT "PK_0a2c5d8bfe49d3bbccff3f17e8c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" DROP CONSTRAINT "PK_d7281c63c176e152e4c531594a8"`,
    );
    await queryRunner.query(`ALTER TABLE "usuario_roles" DROP COLUMN "usuario_id"`);
    await queryRunner.query(
      `ALTER TABLE "usuario_roles" RENAME COLUMN "usuario_num" TO "usuario_id"`,
    );
    await queryRunner.query(`ALTER TABLE "transacciones" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "transacciones" DROP COLUMN "usuario_id"`);
    await queryRunner.query(`ALTER TABLE "transacciones" DROP COLUMN "categoria_id"`);
    await queryRunner.query(`ALTER TABLE "transacciones" RENAME COLUMN "id_num" TO "id"`);
    await queryRunner.query(
      `ALTER TABLE "transacciones" RENAME COLUMN "usuario_num" TO "usuario_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacciones" RENAME COLUMN "categoria_num" TO "categoria_id"`,
    );
    await queryRunner.query(`ALTER TABLE "categorias" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "categorias" DROP COLUMN "usuario_id"`);
    await queryRunner.query(`ALTER TABLE "categorias" RENAME COLUMN "id_num" TO "id"`);
    await queryRunner.query(
      `ALTER TABLE "categorias" RENAME COLUMN "usuario_num" TO "usuario_id"`,
    );
    await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "usuarios" RENAME COLUMN "id_num" TO "id"`);
    await this.serial(queryRunner, 'usuarios');
    await this.serial(queryRunner, 'categorias');
    await this.serial(queryRunner, 'transacciones');
    await queryRunner.query(`ALTER TABLE "categorias" ALTER COLUMN "usuario_id" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transacciones" ALTER COLUMN "usuario_id" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "transacciones" ALTER COLUMN "categoria_id" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "usuario_roles" ALTER COLUMN "usuario_id" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD CONSTRAINT "PK_d7281c63c176e152e4c531594a8" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "categorias" ADD CONSTRAINT "PK_3886a26251605c571c6b4f861fe" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacciones" ADD CONSTRAINT "PK_0a2c5d8bfe49d3bbccff3f17e8c" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuario_roles" ADD CONSTRAINT "PK_c61154df0793c9383ea2bafc22d" PRIMARY KEY ("rol_codigo", "usuario_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "categorias_usuario_tipo_nombre" ON "categorias" ("usuario_id", "tipo_codigo", "nombre_clave")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f4660653ecea0eef621bae5209" ON "usuario_roles" ("usuario_id")`,
    );
    await queryRunner.query(`
      ALTER TABLE "transacciones"
      ADD CONSTRAINT "FK_deddbcadce68c9bacb42b3eb675"
      FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "usuario_roles"
      ADD CONSTRAINT "FK_f4660653ecea0eef621bae52097"
      FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id")
      ON DELETE CASCADE ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuario_roles" DROP CONSTRAINT "FK_f4660653ecea0eef621bae52097"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacciones" DROP CONSTRAINT "FK_deddbcadce68c9bacb42b3eb675"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_f4660653ecea0eef621bae5209"`);
    await queryRunner.query(`DROP INDEX "public"."categorias_usuario_tipo_nombre"`);
    await queryRunner.query(
      `ALTER TABLE "usuario_roles" DROP CONSTRAINT "PK_c61154df0793c9383ea2bafc22d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacciones" DROP CONSTRAINT "PK_0a2c5d8bfe49d3bbccff3f17e8c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categorias" DROP CONSTRAINT "PK_3886a26251605c571c6b4f861fe"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" DROP CONSTRAINT "PK_d7281c63c176e152e4c531594a8"`,
    );
    await queryRunner.query(`ALTER TABLE "usuarios" ADD "id_text" character varying(64)`);
    await queryRunner.query(`UPDATE "usuarios" SET "id_text" = "id"::text`);
    await queryRunner.query(`ALTER TABLE "categorias" ADD "id_uuid" uuid`);
    await queryRunner.query(`UPDATE "categorias" SET "id_uuid" = gen_random_uuid()`);
    await queryRunner.query(
      `ALTER TABLE "categorias" ADD "usuario_text" character varying(64)`,
    );
    await queryRunner.query(`
      UPDATE "categorias" AS categoria
      SET "usuario_text" = usuario."id_text"
      FROM "usuarios" AS usuario
      WHERE categoria."usuario_id" = usuario."id"
    `);
    await queryRunner.query(`ALTER TABLE "transacciones" ADD "id_uuid" uuid`);
    await queryRunner.query(`UPDATE "transacciones" SET "id_uuid" = gen_random_uuid()`);
    await queryRunner.query(
      `ALTER TABLE "transacciones" ADD "usuario_text" character varying(64)`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacciones" ADD "categoria_uuid" uuid`,
    );
    await queryRunner.query(`
      UPDATE "transacciones" AS movimiento
      SET "usuario_text" = usuario."id_text"
      FROM "usuarios" AS usuario
      WHERE movimiento."usuario_id" = usuario."id"
    `);
    await queryRunner.query(`
      UPDATE "transacciones" AS movimiento
      SET "categoria_uuid" = categoria."id_uuid"
      FROM "categorias" AS categoria
      WHERE movimiento."categoria_id" = categoria."id"
    `);
    await queryRunner.query(
      `ALTER TABLE "usuario_roles" ADD "usuario_text" character varying(64)`,
    );
    await queryRunner.query(`
      UPDATE "usuario_roles" AS asignacion
      SET "usuario_text" = usuario."id_text"
      FROM "usuarios" AS usuario
      WHERE asignacion."usuario_id" = usuario."id"
    `);
    await queryRunner.query(`ALTER TABLE "usuario_roles" DROP COLUMN "usuario_id"`);
    await queryRunner.query(
      `ALTER TABLE "usuario_roles" RENAME COLUMN "usuario_text" TO "usuario_id"`,
    );
    await queryRunner.query(`ALTER TABLE "transacciones" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "transacciones" DROP COLUMN "usuario_id"`);
    await queryRunner.query(`ALTER TABLE "transacciones" DROP COLUMN "categoria_id"`);
    await queryRunner.query(`ALTER TABLE "transacciones" DROP COLUMN "moneda"`);
    await queryRunner.query(`ALTER TABLE "transacciones" DROP COLUMN "cotizacion"`);
    await queryRunner.query(`ALTER TABLE "transacciones" RENAME COLUMN "id_uuid" TO "id"`);
    await queryRunner.query(
      `ALTER TABLE "transacciones" RENAME COLUMN "usuario_text" TO "usuario_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacciones" RENAME COLUMN "categoria_uuid" TO "categoria_id"`,
    );
    await queryRunner.query(`ALTER TABLE "categorias" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "categorias" DROP COLUMN "usuario_id"`);
    await queryRunner.query(`ALTER TABLE "categorias" RENAME COLUMN "id_uuid" TO "id"`);
    await queryRunner.query(
      `ALTER TABLE "categorias" RENAME COLUMN "usuario_text" TO "usuario_id"`,
    );
    await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "usuarios" RENAME COLUMN "id_text" TO "id"`);
    await queryRunner.query(`DROP SEQUENCE IF EXISTS "usuarios_id_seq"`);
    await queryRunner.query(`DROP SEQUENCE IF EXISTS "categorias_id_seq"`);
    await queryRunner.query(`DROP SEQUENCE IF EXISTS "transacciones_id_seq"`);
    await queryRunner.query(`ALTER TABLE "usuarios" ALTER COLUMN "id" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "categorias" ALTER COLUMN "id" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "categorias" ALTER COLUMN "usuario_id" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transacciones" ALTER COLUMN "id" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "transacciones" ALTER COLUMN "usuario_id" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "transacciones" ALTER COLUMN "categoria_id" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "usuario_roles" ALTER COLUMN "usuario_id" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD CONSTRAINT "PK_d7281c63c176e152e4c531594a8" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "categorias" ADD CONSTRAINT "PK_3886a26251605c571c6b4f861fe" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "transacciones" ADD CONSTRAINT "PK_0a2c5d8bfe49d3bbccff3f17e8c" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuario_roles" ADD CONSTRAINT "PK_c61154df0793c9383ea2bafc22d" PRIMARY KEY ("usuario_id", "rol_codigo")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "categorias_usuario_tipo_nombre" ON "categorias" ("usuario_id", "tipo_codigo", "nombre_clave")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f4660653ecea0eef621bae5209" ON "usuario_roles" ("usuario_id")`,
    );
    await queryRunner.query(`
      ALTER TABLE "transacciones"
      ADD CONSTRAINT "FK_deddbcadce68c9bacb42b3eb675"
      FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "usuario_roles"
      ADD CONSTRAINT "FK_f4660653ecea0eef621bae52097"
      FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id")
      ON DELETE CASCADE ON UPDATE CASCADE
    `);
    await queryRunner.query(`DROP TABLE "cotizaciones"`);
  }

  private async serial(queryRunner: QueryRunner, table: string) {
    await queryRunner.query(`ALTER TABLE "${table}" ALTER COLUMN "id" SET NOT NULL`);
    await queryRunner.query(
      `CREATE SEQUENCE "${table}_id_seq" OWNED BY "${table}"."id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${table}" ALTER COLUMN "id" SET DEFAULT nextval('"${table}_id_seq"')`,
    );
    await queryRunner.query(`
      SELECT setval(
        '"${table}_id_seq"',
        GREATEST(COALESCE((SELECT MAX("id") FROM "${table}"), 1), 1),
        (SELECT EXISTS (SELECT 1 FROM "${table}"))
      )
    `);
  }
}
