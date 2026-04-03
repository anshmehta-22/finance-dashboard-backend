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

describe('RBAC enforcement', () => {
  let app: Application;
  let prisma: PrismaClient;
  let adminToken: string;
  let analystToken: string;
  let viewerToken: string;
  let viewerId: string;

  beforeAll(async () => {
    resetTestDatabase();
    app = await createTestApp();
    prisma = createTestPrismaClient();

    const adminEmail = randomEmail('rbac.admin');
    const analystEmail = randomEmail('rbac.analyst');
    const viewerEmail = randomEmail('rbac.viewer');

    await request(app).post('/api/auth/register').send({
      email: adminEmail,
      password: 'Admin@1234',
      role: 'ADMIN',
    });

    await request(app).post('/api/auth/register').send({
      email: analystEmail,
      password: 'Analyst@1234',
      role: 'ANALYST',
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
    viewerId = viewerLogin.body.user.id;
  });

  afterAll(async () => {
    await prisma.financialRecord.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
    removeTestDatabaseFiles();
  });

  it('GET /api/users with viewer -> 403', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(response.status).toBe(403);
  });

  it('GET /api/users with analyst -> 403', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(response.status).toBe(403);
  });

  it('GET /api/users with admin -> 200', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('POST /api/users with viewer -> 403', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        email: randomEmail('rbac.post.viewer'),
        password: 'Password@123',
        role: 'VIEWER',
      });

    expect(response.status).toBe(403);
  });

  it('PATCH /api/users/:id/role with analyst -> 403', async () => {
    const response = await request(app)
      .patch(`/api/users/${viewerId}/role`)
      .set('Authorization', `Bearer ${analystToken}`)
      .send({ role: 'ANALYST' });

    expect(response.status).toBe(403);
  });

  it('PATCH /api/users/:id/role with admin -> 200', async () => {
    const response = await request(app)
      .patch(`/api/users/${viewerId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'ANALYST' });

    expect(response.status).toBe(200);
    expect(response.body.data.role).toBe('ANALYST');
  });
});
