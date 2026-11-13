import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1794481412883 implements MigrationInterface {
  name = 'InitialSchema1794481412883';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "tipos_transaccion" (
                "codigo" character varying(16) NOT NULL,
                "nombre" character varying(32) NOT NULL,
                CONSTRAINT "PK_96fadc6145a84efa4a51ab6eaac" PRIMARY KEY ("codigo")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "categorias" (
                "id" uuid NOT NULL,
                "nombre" character varying(80) NOT NULL,
                "nombre_clave" character varying(80) NOT NULL,
                "icono" character varying(32) NOT NULL DEFAULT 'etiqueta',
                "usuario_id" character varying(64) NOT NULL,
                "tipo_codigo" character varying(16) NOT NULL,
                CONSTRAINT "PK_3886a26251605c571c6b4f861fe" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "categorias_usuario_tipo_nombre" ON "categorias" ("usuario_id", "tipo_codigo", "nombre_clave")
        `);
    await queryRunner.query(`
            CREATE TABLE "transacciones" (
                "id" uuid NOT NULL,
                "monto" numeric(14, 2) NOT NULL,
                "fecha" character varying(10) NOT NULL,
                "usuario_id" character varying(64) NOT NULL,
                "creado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "categoria_id" uuid NOT NULL,
                "tipo_codigo" character varying(16) NOT NULL,
                CONSTRAINT "PK_0a2c5d8bfe49d3bbccff3f17e8c" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "permisos" (
                "code" character varying(64) NOT NULL,
                "name" character varying(120) NOT NULL,
                CONSTRAINT "PK_dde02832ce9ac083148f85fc8ec" PRIMARY KEY ("code")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "roles" (
                "code" character varying(32) NOT NULL,
                "name" character varying(80) NOT NULL,
                CONSTRAINT "PK_f6d54f95c31b73fb1bdd8e91d0c" PRIMARY KEY ("code")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "usuarios" (
                "id" character varying(64) NOT NULL,
                "username" character varying(64) NOT NULL,
                "password_hash" text NOT NULL,
                CONSTRAINT "UQ_9f78cfde576fc28f279e2b7a9cb" UNIQUE ("username"),
                CONSTRAINT "PK_d7281c63c176e152e4c531594a8" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "rol_permisos" (
                "rol_codigo" character varying(32) NOT NULL,
                "permiso_codigo" character varying(64) NOT NULL,
                CONSTRAINT "PK_a9c0d095d44b32e466ff4044597" PRIMARY KEY ("rol_codigo", "permiso_codigo")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_84dc45a5382f384e25983d1574" ON "rol_permisos" ("rol_codigo")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_7262c52a0f810aa03d225a41d4" ON "rol_permisos" ("permiso_codigo")
        `);
    await queryRunner.query(`
            CREATE TABLE "usuario_roles" (
                "usuario_id" character varying(64) NOT NULL,
                "rol_codigo" character varying(32) NOT NULL,
                CONSTRAINT "PK_c61154df0793c9383ea2bafc22d" PRIMARY KEY ("usuario_id", "rol_codigo")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f4660653ecea0eef621bae5209" ON "usuario_roles" ("usuario_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_4c682b785bd1f7ea08d26db2cd" ON "usuario_roles" ("rol_codigo")
        `);
    await queryRunner.query(`
            ALTER TABLE "categorias"
            ADD CONSTRAINT "FK_9717004521d4fa586fd37e851a9" FOREIGN KEY ("tipo_codigo") REFERENCES "tipos_transaccion"("codigo") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "transacciones"
            ADD CONSTRAINT "FK_deddbcadce68c9bacb42b3eb675" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "transacciones"
            ADD CONSTRAINT "FK_de53cc7e2fecf87bc82da318ae9" FOREIGN KEY ("tipo_codigo") REFERENCES "tipos_transaccion"("codigo") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "rol_permisos"
            ADD CONSTRAINT "FK_84dc45a5382f384e25983d15742" FOREIGN KEY ("rol_codigo") REFERENCES "roles"("code") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE "rol_permisos"
            ADD CONSTRAINT "FK_7262c52a0f810aa03d225a41d41" FOREIGN KEY ("permiso_codigo") REFERENCES "permisos"("code") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE "usuario_roles"
            ADD CONSTRAINT "FK_f4660653ecea0eef621bae52097" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
    await queryRunner.query(`
            ALTER TABLE "usuario_roles"
            ADD CONSTRAINT "FK_4c682b785bd1f7ea08d26db2cdc" FOREIGN KEY ("rol_codigo") REFERENCES "roles"("code") ON DELETE CASCADE ON UPDATE CASCADE
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "usuario_roles" DROP CONSTRAINT "FK_4c682b785bd1f7ea08d26db2cdc"
        `);
    await queryRunner.query(`
            ALTER TABLE "usuario_roles" DROP CONSTRAINT "FK_f4660653ecea0eef621bae52097"
        `);
    await queryRunner.query(`
            ALTER TABLE "rol_permisos" DROP CONSTRAINT "FK_7262c52a0f810aa03d225a41d41"
        `);
    await queryRunner.query(`
            ALTER TABLE "rol_permisos" DROP CONSTRAINT "FK_84dc45a5382f384e25983d15742"
        `);
    await queryRunner.query(`
            ALTER TABLE "transacciones" DROP CONSTRAINT "FK_de53cc7e2fecf87bc82da318ae9"
        `);
    await queryRunner.query(`
            ALTER TABLE "transacciones" DROP CONSTRAINT "FK_deddbcadce68c9bacb42b3eb675"
        `);
    await queryRunner.query(`
            ALTER TABLE "categorias" DROP CONSTRAINT "FK_9717004521d4fa586fd37e851a9"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_4c682b785bd1f7ea08d26db2cd"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_f4660653ecea0eef621bae5209"
        `);
    await queryRunner.query(`
            DROP TABLE "usuario_roles"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_7262c52a0f810aa03d225a41d4"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_84dc45a5382f384e25983d1574"
        `);
    await queryRunner.query(`
            DROP TABLE "rol_permisos"
        `);
    await queryRunner.query(`
            DROP TABLE "usuarios"
        `);
    await queryRunner.query(`
            DROP TABLE "roles"
        `);
    await queryRunner.query(`
            DROP TABLE "permisos"
        `);
    await queryRunner.query(`
            DROP TABLE "transacciones"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."categorias_usuario_tipo_nombre"
        `);
    await queryRunner.query(`
            DROP TABLE "categorias"
        `);
    await queryRunner.query(`
            DROP TABLE "tipos_transaccion"
        `);
  }
}
