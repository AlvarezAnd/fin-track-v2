import { MigrationInterface, QueryRunner } from 'typeorm';

export class TransactionDetail1794484000000 implements MigrationInterface {
  name = 'TransactionDetail1794484000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transacciones" ADD COLUMN "detalle" character varying(200)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transacciones" DROP COLUMN "detalle"`);
  }
}
