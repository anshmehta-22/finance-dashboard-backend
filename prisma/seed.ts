import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { env } from '../src/config/env';

const prisma = new PrismaClient();

const requireSeedPassword = (key: string, value?: string): string => {
  if (!value) {
    throw new Error(
      `Missing required environment variable for seeding: ${key}`,
    );
  }

  if (value.length < 12) {
    throw new Error(
      `${key} must be at least 12 characters for safer seeded credentials.`,
    );
  }

  return value;
};

async function main() {
  const adminSeedPassword = requireSeedPassword(
    'SEED_ADMIN_PASSWORD',
    env.SEED_ADMIN_PASSWORD,
  );
  const analystSeedPassword = requireSeedPassword(
    'SEED_ANALYST_PASSWORD',
    env.SEED_ANALYST_PASSWORD,
  );
  const viewerSeedPassword = requireSeedPassword(
    'SEED_VIEWER_PASSWORD',
    env.SEED_VIEWER_PASSWORD,
  );

  const adminPassword = await bcrypt.hash(adminSeedPassword, 10);
  const analystPassword = await bcrypt.hash(analystSeedPassword, 10);
  const viewerPassword = await bcrypt.hash(viewerSeedPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@finance.com' },
    update: {
      passwordHash: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      email: 'admin@finance.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@finance.com' },
    update: {
      passwordHash: analystPassword,
      role: 'ANALYST',
      isActive: true,
    },
    create: {
      email: 'analyst@finance.com',
      passwordHash: analystPassword,
      role: 'ANALYST',
      isActive: true,
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@finance.com' },
    update: {
      passwordHash: viewerPassword,
      role: 'VIEWER',
      isActive: true,
    },
    create: {
      email: 'viewer@finance.com',
      passwordHash: viewerPassword,
      role: 'VIEWER',
      isActive: true,
    },
  });

  const seedYear = 2024;
  const sampleRecords = [
    {
      id: 'seed-record-001',
      amount: 6200,
      type: 'INCOME',
      category: 'Salary',
      date: new Date(seedYear, 0, 2),
      notes: 'Monthly salary payout',
      createdById: admin.id,
    },
    {
      id: 'seed-record-002',
      amount: 85,
      type: 'EXPENSE',
      category: 'Food',
      date: new Date(seedYear, 0, 5),
      notes: 'Groceries and snacks',
      createdById: viewer.id,
    },
    {
      id: 'seed-record-003',
      amount: 140,
      type: 'EXPENSE',
      category: 'Utilities',
      date: new Date(seedYear, 0, 8),
      notes: 'Electricity and internet bills',
      createdById: analyst.id,
    },
    {
      id: 'seed-record-004',
      amount: 60,
      type: 'EXPENSE',
      category: 'Transport',
      date: new Date(seedYear, 0, 12),
      notes: 'Metro and rideshare expenses',
      createdById: analyst.id,
    },
    {
      id: 'seed-record-005',
      amount: 95,
      type: 'EXPENSE',
      category: 'Entertainment',
      date: new Date(seedYear, 0, 16),
      notes: 'Movie and streaming subscriptions',
      createdById: viewer.id,
    },
    {
      id: 'seed-record-006',
      amount: 6100,
      type: 'INCOME',
      category: 'Salary',
      date: new Date(seedYear, 1, 2),
      notes: 'Previous month salary',
      createdById: admin.id,
    },
    {
      id: 'seed-record-007',
      amount: 78,
      type: 'EXPENSE',
      category: 'Food',
      date: new Date(seedYear, 1, 7),
      notes: 'Weekly meal prep shopping',
      createdById: analyst.id,
    },
    {
      id: 'seed-record-008',
      amount: 132,
      type: 'EXPENSE',
      category: 'Utilities',
      date: new Date(seedYear, 2, 6),
      notes: 'Water and gas bills',
      createdById: viewer.id,
    },
    {
      id: 'seed-record-009',
      amount: 55,
      type: 'EXPENSE',
      category: 'Transport',
      date: new Date(seedYear, 2, 11),
      notes: 'Fuel and parking',
      createdById: analyst.id,
    },
    {
      id: 'seed-record-010',
      amount: 120,
      type: 'EXPENSE',
      category: 'Entertainment',
      date: new Date(seedYear, 2, 20),
      notes: 'Weekend outing',
      createdById: admin.id,
    },
  ];

  for (const record of sampleRecords) {
    const { id, ...data } = record;
    await prisma.financialRecord.upsert({
      where: { id },
      update: data,
      create: {
        id,
        ...data,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
