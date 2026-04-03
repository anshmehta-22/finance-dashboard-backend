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

describe('Auth endpoints', () => {
  let app: Application;
  let prisma: PrismaClient;

  beforeAll(async () => {
    resetTestDatabase();
    app = await createTestApp();
    prisma = createTestPrismaClient();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
    removeTestDatabaseFiles();
  });

  it('POST /api/auth/register with valid data -> 201 and returns user without passwordHash', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: randomEmail('auth.register.valid'),
      password: 'Password@123',
      role: 'VIEWER',
    });

    expect(response.status).toBe(201);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.email).toBeDefined();
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it('POST /api/auth/register with duplicate email -> 400 or 409', async () => {
    const email = randomEmail('auth.register.duplicate');

    await request(app).post('/api/auth/register').send({
      email,
      password: 'Password@123',
      role: 'VIEWER',
    });

    const duplicateResponse = await request(app).post('/api/auth/register').send({
      email,
      password: 'Password@123',
      role: 'VIEWER',
    });

    expect([400, 409]).toContain(duplicateResponse.status);
  });

  it('POST /api/auth/register with invalid email -> 400', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: 'not-an-email',
      password: 'Password@123',
      role: 'VIEWER',
    });

    expect(response.status).toBe(400);
  });

  it('POST /api/auth/register with short password -> 400', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: randomEmail('auth.register.short-password'),
      password: 'short',
      role: 'VIEWER',
    });

    expect(response.status).toBe(400);
  });

  it('POST /api/auth/login with valid credentials -> 200 and returns token', async () => {
    const email = randomEmail('auth.login.valid');
    const password = 'Password@123';

    await request(app).post('/api/auth/register').send({
      email,
      password,
      role: 'VIEWER',
    });

    const loginResponse = await request(app).post('/api/auth/login').send({
      email,
      password,
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.token).toBeDefined();
    expect(typeof loginResponse.body.token).toBe('string');
  });

  it('POST /api/auth/login with wrong password -> 401', async () => {
    const email = randomEmail('auth.login.wrong-password');

    await request(app).post('/api/auth/register').send({
      email,
      password: 'Password@123',
      role: 'VIEWER',
    });

    const response = await request(app).post('/api/auth/login').send({
      email,
      password: 'WrongPassword@123',
    });

    expect(response.status).toBe(401);
  });

  it('POST /api/auth/login with nonexistent email -> 401', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: randomEmail('auth.login.nonexistent'),
      password: 'Password@123',
    });

    expect(response.status).toBe(401);
  });
});
