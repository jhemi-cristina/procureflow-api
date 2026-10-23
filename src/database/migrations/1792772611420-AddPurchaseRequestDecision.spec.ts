
import { QueryRunner } from 'typeorm';
import { AddPurchaseRequestDecision1792772611420 } from './1792772611420-AddPurchaseRequestDecision';

describe('AddPurchaseRequestDecision1792772611420', () => {
  let migration: AddPurchaseRequestDecision1792772611420;
  let queryRunner: jest.Mocked<Pick<QueryRunner, 'query'>>;

  beforeEach(() => {
    migration = new AddPurchaseRequestDecision1792772611420();

    queryRunner = {
      query: jest.fn().mockResolvedValue(undefined),
    };
  });

  describe('up', () => {
    it('deve adicionar as colunas e a chave estrangeira', async () => {
      await migration.up(queryRunner as QueryRunner);

      expect(queryRunner.query).toHaveBeenCalledTimes(4);

      expect(queryRunner.query).toHaveBeenNthCalledWith(
        1,
        'ALTER TABLE "purchase_requests" ADD "decision_reason" text',
      );

      expect(queryRunner.query).toHaveBeenNthCalledWith(
        2,
        'ALTER TABLE "purchase_requests" ADD "decided_at" TIMESTAMP WITH TIME ZONE',
      );

      expect(queryRunner.query).toHaveBeenNthCalledWith(
        3,
        'ALTER TABLE "purchase_requests" ADD "decided_by_id" uuid',
      );

      expect(queryRunner.query).toHaveBeenNthCalledWith(
        4,
        'ALTER TABLE "purchase_requests" ADD CONSTRAINT "FK_677504250e6f610f94d034f9a39" FOREIGN KEY ("decided_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION',
      );
    });

    it('deve propagar erros durante a execução da migration', async () => {
      queryRunner.query.mockRejectedValueOnce(
        new Error('Falha ao adicionar coluna'),
      );

      await expect(
        migration.up(queryRunner as QueryRunner),
      ).rejects.toThrow('Falha ao adicionar coluna');
    });
  });

  describe('down', () => {
    it('deve remover a chave estrangeira e as colunas na ordem correta', async () => {
      await migration.down(queryRunner as QueryRunner);

      expect(queryRunner.query).toHaveBeenCalledTimes(4);

      expect(queryRunner.query).toHaveBeenNthCalledWith(
        1,
        'ALTER TABLE "purchase_requests" DROP CONSTRAINT "FK_677504250e6f610f94d034f9a39"',
      );

      expect(queryRunner.query).toHaveBeenNthCalledWith(
        2,
        'ALTER TABLE "purchase_requests" DROP COLUMN "decided_by_id"',
      );

      expect(queryRunner.query).toHaveBeenNthCalledWith(
        3,
        'ALTER TABLE "purchase_requests" DROP COLUMN "decided_at"',
      );

      expect(queryRunner.query).toHaveBeenNthCalledWith(
        4,
        'ALTER TABLE "purchase_requests" DROP COLUMN "decision_reason"',
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
