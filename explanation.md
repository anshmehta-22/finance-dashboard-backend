# Finance Dashboard Backend - Architecture Notes

This file explains how the project is designed and why key implementation choices were made. For setup and full endpoint listing, use `README.md`.

## Project Snapshot

Backend API for a finance dashboard with:

- JWT authentication
- Role-based access control (RBAC)
- Financial records CRUD with filtering and pagination
- Dashboard analytics (summary, categories, trends, recent activity)
- Swagger API docs at `/api/docs`

## Design Goals

- Keep authorization rules centralized and explicit.
- Keep module boundaries clear (`router -> controller -> service`).
- Keep local setup friction low (SQLite + Prisma).
- Keep API behavior testable and documented.

## Technical Stack

| Layer      | Choice                   | Reason                                     |
| ---------- | ------------------------ | ------------------------------------------ |
| Language   | TypeScript               | Strong typing and safer refactoring        |
| Framework  | Express                  | Lightweight, explicit request pipeline     |
| ORM        | Prisma                   | Typed DB access and migration workflow     |
| Database   | SQLite (dev) / PostgreSQL (prod) | Zero-infra local development, production-ready deployment |
| Validation | Zod                      | Runtime validation aligned with TypeScript |
| Auth       | JWT                      | Stateless, standard API authentication     |
| API Docs   | Swagger                  | Fast endpoint discoverability and testing  |
| Deployment | Render (backend) + Supabase (database) | Free hosting with persistent PostgreSQL, no session limits |

## Data Model

`User`

- `id`, `email`, `passwordHash`, `role`, `isActive`, `createdAt`

`FinancialRecord`

- `id`, `amount`, `type`, `category`, `date`, `notes`, `createdById`, `createdAt`, `updatedAt`, `deletedAt`

Notes:

- `role` and `type` are persisted as strings (`VIEWER|ANALYST|ADMIN`, `INCOME|EXPENSE`).
- API-level validation restricts accepted values.
- `FinancialRecord.createdById -> User.id` keeps authorship traceable.
- `deletedAt` is nullable — `null` means active, a timestamp means soft-deleted. All standard queries filter `deletedAt: null` to exclude deleted records.

## RBAC Model

Permission map (source of truth: `src/middleware/rbac.middleware.ts`):

- `VIEWER`: `records:read`, `dashboard:read`
- `ANALYST`: `records:read`, `dashboard:read`, `dashboard:insights`
- `ADMIN`: all viewer/analyst permissions plus `records:write`, `records:delete`, `users:read`, `users:write`

Effectively:

- Users module is admin-only.
- Record writes/deletes are admin-only.
- Dashboard trends are analyst/admin only.
- Core reads are available to all authenticated roles.

## Request Lifecycle

Typical protected request flow:

1. `authMiddleware` validates bearer token and attaches `req.user`.
2. `rbac(permission)` checks the role permission map.
3. `validateMiddleware(schema)` checks params/query/body where applicable.
4. Controller delegates business logic to service.
5. Service talks to Prisma and returns shaped response.

Global behavior:

- Unmatched routes return `404` with `{ "error": "Route not found" }`.
- `errorMiddleware` is mounted last for centralized error formatting.

## Module Organization

Project follows feature modules under `src/modules`:

- `auth`: register and login
- `users`: user management and role/status updates
- `records`: CRUD + filters (type, category, date range, pagination)
- `dashboard`: summary, category grouping, trends, recent activity

Each module generally contains:

- `*.router.ts` for route definitions
- `*.controller.ts` for HTTP orchestration
- `*.service.ts` for business/data logic
- `*.schema.ts` for Zod request schemas (where needed)

## Seeding Strategy

Seeder (`prisma/seed.ts`) provisions:

- 3 users: admin, analyst, viewer
- Deterministic sample records using IDs `seed-record-001` to `seed-record-010`

Why deterministic IDs:

- Seed is idempotent via Prisma `upsert`.
- Re-running seed updates fixtures instead of creating duplicates.

Password handling:

- Seed passwords are required via env vars (no weak defaults):
  - `SEED_ADMIN_PASSWORD`
  - `SEED_ANALYST_PASSWORD`
  - `SEED_VIEWER_PASSWORD`

## Operational Notes

- Local API docs: `http://localhost:3000/api/docs`
- Production API docs: `https://finance-data-processing-nn74.onrender.com/api/docs`
- Health endpoint: `GET /health`
- Build command: `npm run build`
- Dev command: `npm run dev`

## Production Deployment

**Stack: Render (backend) + Supabase (database)**

The application is deployed on Render with Supabase PostgreSQL:

- **Backend Platform:** Render (https://render.com)
- **Database:** Supabase PostgreSQL (https://supabase.com) — free tier with no session limits
- **Database Connection:** Direct connection (port 5432) for schema engine compatibility
- **Build Process:** Automated via git push to main branch
- **Environment Variables:** Securely stored in Render dashboard
  - `DATABASE_URL`: Supabase direct connection string
  - `JWT_SECRET`: 32-byte random hex string
  - `SEED_*_PASSWORD`: Strong passwords for seed users
  - `NODE_ENV`: `production`
  - `PORT`: `3000`
- **Deployment URL:** https://finance-data-processing-nn74.onrender.com
- **Build Command:** `NODE_ENV=development npm install && npx prisma generate && npm run build`
- **Start Command:** `node dist/server.js`

### Database Migration

Migrating from local SQLite to Supabase PostgreSQL involved:

1. Create Supabase project and get connection credentials
2. Generate initial migration: `npx prisma migrate dev --name init`
3. Apply migration: `npx prisma migrate deploy`
4. Seed data: `npm run seed`
5. Update Render environment with `DATABASE_URL` pointing to Supabase

Key insight: Prisma's database-agnostic architecture meant schema and queries required no changes — only the datasource connection URL changed.

### Known Limitations in Production

- Rate limiting is in-memory — sufficient for single-instance deployment but needs a Redis-backed store (e.g. `rate-limit-redis`) for horizontal scaling
- No JWT token revocation — tokens are valid until expiry; acceptable at this scope, mitigated by 7-day expiry window
- Cold starts on Render (~30s after inactivity) — acceptable for portfolio use

## Build Order

1. ✅ Project bootstrap and base Express server
2. ✅ Authentication module (register/login + JWT)
3. ✅ RBAC middleware and permission model
4. ✅ Financial records CRUD module
5. ✅ Dashboard analytics module
6. ✅ Swagger documentation and endpoint annotations
7. ✅ Test suite and integration verification

## Decision Log

| Date       | Decision                                            | Why                                                                               |
| ---------- | --------------------------------------------------- | --------------------------------------------------------------------------------- |
| 2026-04-03 | Stored role/type as strings instead of Prisma enums | Avoided SQLite enum compatibility issues while preserving strict API validation   |
| 2026-04-03 | Swagger exposed at `/api/docs`                      | Better onboarding and assignment review experience                                |
| 2026-04-03 | Added global 404 handler before error middleware    | Consistent JSON response for unknown routes                                       |
| 2026-04-03 | Converted seed records to deterministic `upsert`    | Stable, repeatable seed behavior                                                  |
| 2026-04-04 | Soft delete added for financial records             | Financial records should never be permanently destroyed; audit trail matters      |
| 2026-04-04 | Added two-tier rate limiting                        | General API protection plus stricter auth endpoint protection against brute force |
| 2026-04-04 | Added records search query support                  | Combined search with existing filters using a Prisma `OR` clause                  |
| 2026-04-04 | Added integration tests with Jest + Supertest       | Validates auth, records, dashboard, and RBAC behavior end to end                  |
| 2026-04-05 | Deployed to Railway with PostgreSQL                 | Validates Prisma's database-agnostic design; migration required only a datasource config change |
| 2026-04-05 | Trust proxy enabled in Express | Required for correct IP detection and rate limiting behind Railway's reverse proxy |
| 2026-06-01 | Migrated to Render + Supabase | Free tier without session limits; Supabase provides persistent PostgreSQL without infrastructure management |

## If You Feel Lost

- Tests failing? Check whether `test.db` is corrupted. Delete it and rerun `npm test`.
- Rate limit hitting in dev? Temporarily increase `max` values in `src/config/rateLimiter.ts`.
- Seed failing? Make sure `SEED_ADMIN_PASSWORD`, `SEED_ANALYST_PASSWORD`, and `SEED_VIEWER_PASSWORD` are all set in `.env` before running `npm run seed`
- ESLint not running? Run `npm install` first — the TypeScript ESLint parser is in devDependencies
- Server not starting? Port 3000 may be in use — change `PORT` in `.env` or kill the existing process
- Production not reflecting changes? Render auto-deploys on push to main — check the Render dashboard build logs
- Can't connect to Supabase during migration? Use the direct connection URL (port 5432, not pooler port 6543) — the connection pooler has compatibility issues with Prisma's schema engine

## Maintenance Guideline

Update this file when one of these changes:

- Role/permission model
- Module boundaries
- Data model structure
- Error handling conventions
- Seed strategy or default credentials
