
import { QueryRunner } from 'typeorm';
import { CreatePurchaseRequests1792766893172 } from './1792766893172-CreatePurchaseRequests';

describe('CreatePurchaseRequests1792766893172', () => {
  let migration: CreatePurchaseRequests1792766893172;
  let queryRunner: jest.Mocked<Pick<QueryRunner, 'query'>>;

  beforeEach(() => {
    migration = new CreatePurchaseRequests1792766893172();

    queryRunner = {
      query: jest.fn().mockResolvedValue(undefined),
    };
  });

  describe('up', () => {
    it('deve criar o enum, a tabela e a chave estrangeira', async () => {
      await migration.up(queryRunner as QueryRunner);

      expect(queryRunner.query).toHaveBeenCalledTimes(3);

      expect(queryRunner.query).toHaveBeenNthCalledWith(
        1,
        `CREATE TYPE "public"."purchase_requests_status_enum" AS ENUM('draft', 'pending', 'approved', 'rejected', 'cancelled')`,
      );

      expect(queryRunner.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('CREATE TABLE "purchase_requests"'),
      );

      expect(queryRunner.query).toHaveBeenNthCalledWith(
        3,
        `ALTER TABLE "purchase_requests" ADD CONSTRAINT "FK_f4a79f7b7ce5945c1c2f7e07174" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
      );
    });

    it('deve definir as colunas e a chave primária corretamente', async () => {
      await migration.up(queryRunner as QueryRunner);

      const sql = queryRunner.query.mock.calls[1][0] as string;

      expect(sql).toContain('"id" uuid NOT NULL DEFAULT uuid_generate_v4()');
      expect(sql).toContain('"title" character varying(180) NOT NULL');
      expect(sql).toContain('"description" text');
      expect(sql).toContain('"estimated_amount" numeric(12,2) NOT NULL');
      expect(sql).toContain('"requester_id" uuid NOT NULL');
      expect(sql).toContain('PRIMARY KEY ("id")');
    });

    it('deve propagar erros durante a execução da migration', async () => {
      queryRunner.query.mockRejectedValueOnce(
        new Error('Falha ao criar enum'),
      );

      await expect(
        migration.up(queryRunner as QueryRunner),
      ).rejects.toThrow('Falha ao criar enum');
    });
  });

  describe('down', () => {
    it('deve remover a chave estrangeira, a tabela e o enum nessa ordem', async () => {
      await migration.down(queryRunner as QueryRunner);

      expect(queryRunner.query).toHaveBeenCalledTimes(3);

      expect(queryRunner.query).toHaveBeenNthCalledWith(
        1,
        `ALTER TABLE "purchase_requests" DROP CONSTRAINT "FK_f4a79f7b7ce5945c1c2f7e07174"`,
      );

      expect(queryRunner.query).toHaveBeenNthCalledWith(
        2,
        'DROP TABLE "purchase_requests"',
      );

      expect(queryRunner.query).toHaveBeenNthCalledWith(
        3,
        'DROP TYPE "public"."purchase_requests_status_enum"',
      );
    });

    it('deve propagar erros durante a reversão da migration', async () => {
      queryRunner.query.mockRejectedValueOnce(
        new Error('Falha ao remover chave estrangeira'),
      );

      await expect(
        migration.down(queryRunner as QueryRunner),
      ).rejects.toThrow('Falha ao remover chave estrangeira');
    });
  });
});
