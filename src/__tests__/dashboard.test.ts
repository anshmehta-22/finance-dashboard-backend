import request from 'supertest';
import { Application } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  createTestApp,
  createTestPrismaClient,
  randomEmail,
  removeTestDatabaseFiles,
  resetTestDatabase,
} from './testUtils';

describe('Dashboard access control', () => {
  let app: Application;
  let prisma: PrismaClient;
  let adminToken: string;
  let analystToken: string;
  let viewerToken: string;

  beforeAll(async () => {
    resetTestDatabase();
    app = await createTestApp();
    prisma = createTestPrismaClient();

    const adminEmail = randomEmail('dashboard.admin');
    const analystEmail = randomEmail('dashboard.analyst');
    const viewerEmail = randomEmail('dashboard.viewer');

    const users = [
      { email: adminEmail, password: 'Admin@1234', role: 'ADMIN' },
      { email: analystEmail, password: 'Analyst@1234', role: 'ANALYST' },
      { email: viewerEmail, password: 'Viewer@1234', role: 'VIEWER' },
    ];

    for (const user of users) {
      await request(app).post('/api/auth/register').send(user);
    }

    const adminLogin = await request(app).post('/api/auth/login').send({
      email: adminEmail,
      password: 'Admin@1234',
    });

    const analystLogin = await request(app).post('/api/auth/login').send({
      email: analystEmail,
      password: 'Analyst@1234',
    });

    const viewerLogin = await request(app).post('/api/auth/login').send({
      email: viewerEmail,
      password: 'Viewer@1234',
    });

    adminToken = adminLogin.body.token;
    analystToken = analystLogin.body.token;
    viewerToken = viewerLogin.body.token;

    const seedRecords = [
      {
        amount: 500,
        type: 'INCOME',
        category: 'SeedIncome',
        date: '2024-03-01T00:00:00.000Z',
        notes: 'dashboard seed income',
      },
      {
        amount: 120,
        type: 'EXPENSE',
        category: 'SeedExpense',
        date: '2024-03-02T00:00:00.000Z',
        notes: 'dashboard seed expense',
      },
    ];

    for (const payload of seedRecords) {
      await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
    }
  });

  afterAll(async () => {
    await prisma.financialRecord.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
    removeTestDatabaseFiles();
  });

  it('GET /api/dashboard/summary with viewer -> 200', async () => {
    const response = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(response.status).toBe(200);
  });

  it('GET /api/dashboard/by-category with viewer -> 200', async () => {
    const response = await request(app)
      .get('/api/dashboard/by-category')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(response.status).toBe(200);
  });

  it('GET /api/dashboard/trends with viewer -> 403', async () => {
    const response = await request(app)
      .get('/api/dashboard/trends?period=weekly')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(response.status).toBe(403);
  });

  it('GET /api/dashboard/trends with analyst -> 200', async () => {
    const response = await request(app)
      .get('/api/dashboard/trends?period=monthly')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(response.status).toBe(200);
  });

  it('GET /api/dashboard/recent with viewer -> 200', async () => {
    const response = await request(app)
      .get('/api/dashboard/recent')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(response.status).toBe(200);
  });

  it('summary netBalance equals totalIncome - totalExpenses', async () => {
    await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 1000,
        type: 'INCOME',
        category: 'SalaryTest',
        date: '2024-03-03T00:00:00.000Z',
        notes: 'summary income test',
      });

    await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 400,
        type: 'EXPENSE',
        category: 'RentTest',
        date: '2024-03-04T00:00:00.000Z',
        notes: 'summary expense test',
      });

    const summary = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(summary.status).toBe(200);

    const { totalIncome, totalExpenses, netBalance } = summary.body.data;
    expect(netBalance).toBe(totalIncome - totalExpenses);
  });

  it('created categories appear in /api/dashboard/by-category response', async () => {
    const response = await request(app)
      .get('/api/dashboard/by-category')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);

    const incomeCategories = response.body.data.income.map(
      (item: { category: string }) => item.category
    );
    const expenseCategories = response.body.data.expenses.map(
      (item: { category: string }) => item.category
    );

    expect(incomeCategories).toContain('SalaryTest');
    expect(expenseCategories).toContain('RentTest');
  });
});
