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

let app: Application;
let prisma: PrismaClient;
let adminToken: string;
let viewerToken: string;
let existingRecordId: string;

beforeAll(async () => {
  resetTestDatabase();
  app = await createTestApp();
  prisma = createTestPrismaClient();

  const adminEmail = randomEmail('records.admin');
  const viewerEmail = randomEmail('records.viewer');

  await request(app).post('/api/auth/register').send({
    email: adminEmail,
    password: 'Admin@1234',
    role: 'ADMIN',
  });

  await request(app).post('/api/auth/register').send({
    email: viewerEmail,
    password: 'Viewer@1234',
    role: 'VIEWER',
  });

  const adminLogin = await request(app).post('/api/auth/login').send({
    email: adminEmail,
    password: 'Admin@1234',
  });

  const viewerLogin = await request(app).post('/api/auth/login').send({
    email: viewerEmail,
    password: 'Viewer@1234',
  });

  adminToken = adminLogin.body.token;
  viewerToken = viewerLogin.body.token;

  const payloads = [
    {
      amount: 1200,
      type: 'INCOME',
      category: 'Salary',
      date: '2024-01-05T00:00:00.000Z',
      notes: 'test salary one',
    },
    {
      amount: 350,
      type: 'EXPENSE',
      category: 'Food',
      date: '2024-01-10T00:00:00.000Z',
      notes: 'test groceries',
    },
    {
      amount: 700,
      type: 'INCOME',
      category: 'Freelance',
      date: '2024-01-15T00:00:00.000Z',
      notes: 'test freelance',
    },
  ];

  for (let i = 0; i < payloads.length; i += 1) {
    const created = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payloads[i]);

    if (i === 0) {
      existingRecordId = created.body.data.id;
    }
  }
});

afterAll(async () => {
  await prisma.financialRecord.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
  removeTestDatabaseFiles();
});

describe('Records CRUD', () => {

  it('GET /api/records with admin token -> 200 and has data/total/page/limit', async () => {
    const response = await request(app)
      .get('/api/records')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(typeof response.body.total).toBe('number');
    expect(typeof response.body.page).toBe('number');
    expect(typeof response.body.limit).toBe('number');
  });

  it('GET /api/records with no token -> 401', async () => {
    const response = await request(app).get('/api/records');
    expect(response.status).toBe(401);
  });

  it('POST /api/records with admin token + valid body -> 201', async () => {
    const response = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 250,
        type: 'EXPENSE',
        category: 'Transport',
        date: '2024-01-20T00:00:00.000Z',
        notes: 'test transport',
      });

    expect(response.status).toBe(201);
    expect(response.body.data.id).toBeDefined();
  });

  it('POST /api/records with viewer token -> 403', async () => {
    const response = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        amount: 100,
        type: 'EXPENSE',
        category: 'Food',
        date: '2024-01-21T00:00:00.000Z',
        notes: 'viewer cannot create',
      });

    expect(response.status).toBe(403);
  });

  it('POST /api/records with invalid body -> 400', async () => {
    const response = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: -1,
        type: 'INVALID_TYPE',
        category: '',
      });

    expect(response.status).toBe(400);
  });

  it('GET /api/records/:id with valid id -> 200', async () => {
    const response = await request(app)
      .get(`/api/records/${existingRecordId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(existingRecordId);
  });

  it('GET /api/records/:id with fake id -> 404', async () => {
    const response = await request(app)
      .get('/api/records/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });

  it('PATCH /api/records/:id with admin -> 200', async () => {
    const response = await request(app)
      .patch(`/api/records/${existingRecordId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ notes: 'test salary one updated' });

    expect(response.status).toBe(200);
    expect(response.body.data.notes).toBe('test salary one updated');
  });

  it('DELETE /api/records/:id with admin -> 200 (soft delete)', async () => {
    const response = await request(app)
      .delete(`/api/records/${existingRecordId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Record deleted successfully');
  });

  it('GET /api/records/:id after delete -> 404', async () => {
    const response = await request(app)
      .get(`/api/records/${existingRecordId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });
});

describe('Records filtering', () => {
  it('GET /api/records?type=INCOME -> all results have type INCOME', async () => {
    const response = await request(app)
      .get('/api/records?type=INCOME')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data.every((record: { type: string }) => record.type === 'INCOME')).toBe(
      true
    );
  });

  it('GET /api/records?search=test -> returns matching records', async () => {
    const response = await request(app)
      .get('/api/records?search=test')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/records?page=1&limit=2 -> returns max 2 records', async () => {
    const response = await request(app)
      .get('/api/records?page=1&limit=2')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeLessThanOrEqual(2);
    expect(response.body.limit).toBe(2);
    expect(response.body.page).toBe(1);
  });
});
