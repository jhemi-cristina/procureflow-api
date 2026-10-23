import { config } from 'dotenv';
import { resolve } from 'path';

const result = config({
  path: resolve(__dirname, '.env.e2e'),
  override: true,
});

if (result.error) {
  throw new Error('Não foi possível carregar test/.env.e2e');
}

if (process.env.DB_DATABASE !== 'procureflow_test') {
  throw new Error(
    'Testes E2E bloqueados: DB_DATABASE deve ser procureflow_test',
  );
}

if (
  !process.env.DB_HOST ||
  !process.env.DB_USERNAME ||
  !process.env.DB_PASSWORD
) {
  throw new Error(
    'Testes E2E bloqueados: configure DB_HOST, DB_USERNAME e DB_PASSWORD em test/.env.e2e',
  );
}
