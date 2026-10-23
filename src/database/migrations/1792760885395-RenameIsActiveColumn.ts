import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameIsActiveColumn1792760885395
  implements MigrationInterface
{
  name = 'RenameIsActiveColumn1792760885395';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "isActive" TO "is_active"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "is_active" TO "isActive"`,
    );
  }
}