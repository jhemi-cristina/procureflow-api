import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPurchaseRequestDecision1792772611420 implements MigrationInterface {
    name = 'AddPurchaseRequestDecision1792772611420'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "purchase_requests" ADD "decision_reason" text`);
        await queryRunner.query(`ALTER TABLE "purchase_requests" ADD "decided_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "purchase_requests" ADD "decided_by_id" uuid`);
        await queryRunner.query(`ALTER TABLE "purchase_requests" ADD CONSTRAINT "FK_677504250e6f610f94d034f9a39" FOREIGN KEY ("decided_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "purchase_requests" DROP CONSTRAINT "FK_677504250e6f610f94d034f9a39"`);
        await queryRunner.query(`ALTER TABLE "purchase_requests" DROP COLUMN "decided_by_id"`);
        await queryRunner.query(`ALTER TABLE "purchase_requests" DROP COLUMN "decided_at"`);
        await queryRunner.query(`ALTER TABLE "purchase_requests" DROP COLUMN "decision_reason"`);
    }

}
