import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefreshTokens1794483001000 implements MigrationInterface {
  name = 'RefreshTokens1794483001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tokens_refresco" (
        "id" character varying(64) NOT NULL,
        "family_id" character varying(64) NOT NULL,
        "user_id" character varying(64) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "family_expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "used_at" TIMESTAMP WITH TIME ZONE,
        "claims" jsonb,
        CONSTRAINT "PK_tokens_refresco" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "tokens_refresco_family_id_idx" ON "tokens_refresco" ("family_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "tokens_refresco_user_id_idx" ON "tokens_refresco" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "tokens_refresco_family_expires_at_idx" ON "tokens_refresco" ("family_expires_at")`,
    );
    await queryRunner.query(`
      CREATE TABLE "tokens_refresco_revocaciones" (
        "family_id" character varying(64) NOT NULL,
        "revoked_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_tokens_refresco_revocaciones" PRIMARY KEY ("family_id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "tokens_refresco_revocaciones"`);
    await queryRunner.query(`DROP TABLE "tokens_refresco"`);
  }
}
