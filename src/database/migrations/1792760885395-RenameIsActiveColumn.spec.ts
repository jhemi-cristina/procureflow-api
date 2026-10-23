
import { QueryRunner } from 'typeorm';
import { RenameIsActiveColumn1792760885395 } from './1792760885395-RenameIsActiveColumn';

describe('RenameIsActiveColumn1792760885395', () => {
  let migration: RenameIsActiveColumn1792760885395;
  let queryRunner: jest.Mocked<Pick<QueryRunner, 'query'>>;

  beforeEach(() => {
    migration = new RenameIsActiveColumn1792760885395();

    queryRunner = {
      query: jest.fn().mockResolvedValue(undefined),
    };
  });

  describe('up', () => {
    it('deve renomear isActive para is_active', async () => {
      await migration.up(queryRunner as QueryRunner);

      expect(queryRunner.query).toHaveBeenCalledTimes(1);
      expect(queryRunner.query).toHaveBeenCalledWith(
        'ALTER TABLE "users" RENAME COLUMN "isActive" TO "is_active"',
      );
    });

    it('deve propagar erros ao renomear a coluna', async () => {
      queryRunner.query.mockRejectedValueOnce(
        new Error('Falha ao renomear coluna'),
      );

      await expect(
        migration.up(queryRunner as QueryRunner),
      ).rejects.toThrow('Falha ao renomear coluna');
    });
  });

  describe('down', () => {
    it('deve reverter is_active para isActive', async () => {
      await migration.down(queryRunner as QueryRunner);

      expect(queryRunner.query).toHaveBeenCalledTimes(1);
      expect(queryRunner.query).toHaveBeenCalledWith(
        'ALTER TABLE "users" RENAME COLUMN "is_active" TO "isActive"',
      );
    });

    it('deve propagar erros ao reverter a migration', async () => {
      queryRunner.query.mockRejectedValueOnce(
        new Error('Falha ao reverter renomeação'),
      );

      await expect(
        migration.down(queryRunner as QueryRunner),
      ).rejects.toThrow('Falha ao reverter renomeação');
    });
  });
});
