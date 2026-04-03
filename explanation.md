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

| Layer      | Choice     | Reason                                     |
| ---------- | ---------- | ------------------------------------------ |
| Language   | TypeScript | Strong typing and safer refactoring        |
| Framework  | Express    | Lightweight, explicit request pipeline     |
| ORM        | Prisma     | Typed DB access and migration workflow     |
| Database   | SQLite     | Zero-infra local development               |
| Validation | Zod        | Runtime validation aligned with TypeScript |
| Auth       | JWT        | Stateless, standard API authentication     |
| API Docs   | Swagger    | Fast endpoint discoverability and testing  |

## Data Model

`User`

- `id`, `email`, `passwordHash`, `role`, `isActive`, `createdAt`

`FinancialRecord`

- `id`, `amount`, `type`, `category`, `date`, `notes`, `createdById`, `createdAt`, `updatedAt`

Notes:

- `role` and `type` are persisted as strings (`VIEWER|ANALYST|ADMIN`, `INCOME|EXPENSE`).
- API-level validation restricts accepted values.
- `FinancialRecord.createdById -> User.id` keeps authorship traceable.

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

- API docs: `http://localhost:3000/api/docs`
- Health endpoint: `GET /health`
- Build command: `npm run build`
- Dev command: `npm run dev`

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

## If You Feel Lost

- Tests failing? Check whether `test.db` is corrupted. Delete it and rerun `npm test`.
- Rate limit hitting in dev? Temporarily increase `max` values in `src/config/rateLimiter.ts`.

## Maintenance Guideline

Update this file when one of these changes:

- Role/permission model
- Module boundaries
- Data model structure
- Error handling conventions
- Seed strategy or default credentials
