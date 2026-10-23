import { config } from 'dotenv';
import { resolve } from 'path';
import { DataSource } from 'typeorm';
import { User } from './src/users/entities/user.entity';
import { PurchaseRequest } from './src/purchase-requests/entities/purchase-request.entity';

const envPath = resolve(__dirname, 'test/.env.e2e');
const envResult = config({ path: envPath, override: true });

if (envResult.error) {
  throw new Error('Não foi possível carregar test/.env.e2e');
}

if (process.env.DB_DATABASE !== 'procureflow_test') {
  throw new Error('Execução bloqueada: o banco deve ser procureflow_test');
}

if (!process.env.DB_HOST || !process.env.DB_USERNAME || !process.env.DB_PASSWORD) {
  throw new Error('Configure DB_HOST, DB_USERNAME e DB_PASSWORD em test/.env.e2e');
}

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [User, PurchaseRequest],
  migrations: ['src/database/migrations/!(*.spec).ts'],
  migrationsTableName: 'migrations',
  synchronize: false,
});
