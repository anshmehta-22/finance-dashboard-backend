import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';

export const TEST_DATABASE_URL = 'file:./test.db';

export const ensureTestEnv = (): void => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
};

export const resetTestDatabase = (): void => {
  ensureTestEnv();

  execSync('npx prisma db push --force-reset --skip-generate', {
    env: {
      ...process.env,
      DATABASE_URL: TEST_DATABASE_URL,
    },
    stdio: 'pipe',
  });
};

export const createTestPrismaClient = (): PrismaClient => {
  ensureTestEnv();

  return new PrismaClient({
    datasources: {
      db: {
        url: TEST_DATABASE_URL,
      },
    },
  });
};

export const removeTestDatabaseFiles = (): void => {
  const dbPath = join(process.cwd(), 'prisma', 'test.db');
  const dbWalPath = join(process.cwd(), 'prisma', 'test.db-journal');

  rmSync(dbPath, { force: true });
  rmSync(dbWalPath, { force: true });
};

export const createTestApp = async () => {
  ensureTestEnv();
  const { createApp } = await import('../app');
  return createApp();
};

export const randomEmail = (prefix: string): string =>
  `${prefix}.${Date.now()}.${Math.floor(Math.random() * 10000)}@example.com`;
