import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePurchaseRequests1792766893172 implements MigrationInterface {
    name = 'CreatePurchaseRequests1792766893172'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."purchase_requests_status_enum" AS ENUM('draft', 'pending', 'approved', 'rejected', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "purchase_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(180) NOT NULL, "description" text, "estimated_amount" numeric(12,2) NOT NULL, "status" "public"."purchase_requests_status_enum" NOT NULL DEFAULT 'draft', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "requester_id" uuid NOT NULL, CONSTRAINT "PK_f3c5a8ff7bd4338f4c860925c8f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "purchase_requests" ADD CONSTRAINT "FK_f4a79f7b7ce5945c1c2f7e07174" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "purchase_requests" DROP CONSTRAINT "FK_f4a79f7b7ce5945c1c2f7e07174"`);
        await queryRunner.query(`DROP TABLE "purchase_requests"`);
        await queryRunner.query(`DROP TYPE "public"."purchase_requests_status_enum"`);
    }

}
