import { QueryRunner } from 'typeorm';
import { CreateUsers1792760429734 } from './1792760429734-CreateUsers';

describe('CreateUsers1792760429734', () => {
  let migration: CreateUsers1792760429734;
  let queryRunner: jest.Mocked<Pick<QueryRunner, 'query'>>;

  beforeEach(() => {
    migration = new CreateUsers1792760429734();

    queryRunner = {
      query: jest.fn().mockResolvedValue(undefined),
    };
  });

  describe('up', () => {
    it('deve criar a extensão UUID, o enum de papéis e a tabela users', async () => {
      await migration.up(queryRunner as QueryRunner);

      expect(queryRunner.query).toHaveBeenCalledTimes(3);

      expect(queryRunner.query).toHaveBeenNthCalledWith(
        1,
        'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"',
      );

      expect(queryRunner.query).toHaveBeenNthCalledWith(
        2,
        `CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'requester', 'approver')`,
      );

      expect(queryRunner.query).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('CREATE TABLE "users"'),
      );
    });

    it('deve definir email como único e id como chave primária', async () => {
      await migration.up(queryRunner as QueryRunner);

      const sql = queryRunner.query.mock.calls[2][0] as string;

      expect(sql).toContain('UNIQUE ("email")');
      expect(sql).toContain('PRIMARY KEY ("id")');
      expect(sql).toContain('uuid_generate_v4()');
    });

    it('deve propagar erros ao executar os comandos SQL', async () => {
      const error = new Error('Falha ao criar tabela');

      queryRunner.query.mockRejectedValueOnce(error);

      await expect(
        migration.up(queryRunner as QueryRunner),
      ).rejects.toThrow('Falha ao criar tabela');
    });
  });

  describe('down', () => {
    it('deve remover a tabela users e o enum de papéis', async () => {
      await migration.down(queryRunner as QueryRunner);

      expect(queryRunner.query).toHaveBeenCalledTimes(2);

      expect(queryRunner.query).toHaveBeenNthCalledWith(
        1,
        'DROP TABLE "users"',
      );

      expect(queryRunner.query).toHaveBeenNthCalledWith(
        2,
        'DROP TYPE "public"."users_role_enum"',
      );
    });

    it('deve propagar erros ao reverter a migration', async () => {
      queryRunner.query.mockRejectedValueOnce(
        new Error('Falha ao remover tabela'),
      );

      await expect(
        migration.down(queryRunner as QueryRunner),
      ).rejects.toThrow('Falha ao remover tabela');
    });
  });
});
