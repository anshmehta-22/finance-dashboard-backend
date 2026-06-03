# Finance Dashboard Backend

Role-based backend API for a finance dashboard with secure auth, record management, and analytics endpoints.

## Tech Stack

- TypeScript
- Node.js + Express
- Prisma ORM
- SQLite (local development) / PostgreSQL (production)
- JWT (`jsonwebtoken`)
- Zod (request validation)
- Swagger (`swagger-jsdoc`, `swagger-ui-express`)

## Live Deployment

**Production URL:** https://finance-data-processing-nn74.onrender.com

**API Documentation:** https://finance-data-processing-nn74.onrender.com/api/docs

Deployed on Render with Supabase PostgreSQL database.

## Prerequisites

- Node.js 18+
- npm

## Setup

1. Clone the repository.
2. Install dependencies:

```bash
npm install
```

3. Copy environment variables template and fill in values:

```bash
cp .env.example .env
```

Required values include:

- `PORT`
- `JWT_SECRET`
- `DATABASE_URL`
- `SEED_ADMIN_PASSWORD` (required for `npm run seed`)
- `SEED_ANALYST_PASSWORD` (required for `npm run seed`)
- `SEED_VIEWER_PASSWORD` (required for `npm run seed`)

Use strong values in production, for example:

```bash
openssl rand -hex 32
```

4. Run Prisma migrations:

```bash
npx prisma migrate dev
```

5. Seed database with initial users and sample records:

```bash
npm run seed
```

**Note:** Database initialization is not automatic. You must run `npm run seed` manually to populate the database before testing or deploying.

6. Start development server:

```bash
npm run dev
```

## API Documentation

Swagger UI is available at:

- **Local:** `http://localhost:3000/api/docs`
- **Production:** `https://finance-data-processing-nn74.onrender.com/api/docs`

The production Swagger UI includes both local and production server options for interactive testing — no local setup needed to explore the API.

## API Endpoints

### Health

| Method | Path      | Required Role | Description                                 |
| ------ | --------- | ------------- | ------------------------------------------- |
| GET    | `/health` | Public        | Health check endpoint returning API status. |

### Auth Module

| Method | Path                 | Required Role | Description                             |
| ------ | -------------------- | ------------- | --------------------------------------- |
| POST   | `/api/auth/register` | Public        | Register a new user account.            |
| POST   | `/api/auth/login`    | Public        | Authenticate user and return JWT token. |

### Users Module

| Method | Path                    | Required Role | Description                         |
| ------ | ----------------------- | ------------- | ----------------------------------- |
| GET    | `/api/users`            | `ADMIN`       | List all users.                     |
| GET    | `/api/users/:id`        | `ADMIN`       | Get a single user by ID.            |
| POST   | `/api/users`            | `ADMIN`       | Create a new user with role.        |
| PATCH  | `/api/users/:id/role`   | `ADMIN`       | Update a user's role.               |
| PATCH  | `/api/users/:id/status` | `ADMIN`       | Activate/deactivate a user account. |

### Records Module

| Method | Path               | Required Role                | Description                                               |
| ------ | ------------------ | ---------------------------- | --------------------------------------------------------- |
| POST   | `/api/records`     | `ADMIN`                      | Create a new financial record.                            |
| GET    | `/api/records`     | `VIEWER`, `ANALYST`, `ADMIN` | List records with optional filters and pagination.        |
| GET    | `/api/records/:id` | `VIEWER`, `ANALYST`, `ADMIN` | Get a financial record by ID.                             |
| PATCH  | `/api/records/:id` | `ADMIN`                      | Update an existing financial record.                      |
| DELETE | `/api/records/:id` | `ADMIN`                      | Soft-delete a financial record (not permanently removed). |

### Dashboard Module

| Method | Path                         | Required Role                | Description                                          |
| ------ | ---------------------------- | ---------------------------- | ---------------------------------------------------- | --------- |
| GET    | `/api/dashboard/summary`     | `VIEWER`, `ANALYST`, `ADMIN` | Get total income, expenses, and net balance.         |
| GET    | `/api/dashboard/by-category` | `VIEWER`, `ANALYST`, `ADMIN` | Get income/expense totals grouped by category.       |
| GET    | `/api/dashboard/categories`  | `VIEWER`, `ANALYST`, `ADMIN` | Alias of category breakdown endpoint.                |
| GET    | `/api/dashboard/trends`      | `ANALYST`, `ADMIN`           | Get monthly/weekly trend analytics (`?period=monthly | weekly`). |
| GET    | `/api/dashboard/recent`      | `VIEWER`, `ANALYST`, `ADMIN` | Get latest 10 records with creator details.          |

## Seed Credentials

After running `npm run seed`, these accounts are available.

Passwords are defined by you in `.env`:

| Role    | Email               | .env Variable         |
| ------- | ------------------- | --------------------- |
| Admin   | admin@finance.com   | SEED_ADMIN_PASSWORD   |
| Analyst | analyst@finance.com | SEED_ANALYST_PASSWORD |
| Viewer  | viewer@finance.com  | SEED_VIEWER_PASSWORD  |

Example values to add to your `.env` before seeding:

```
SEED_ADMIN_PASSWORD=Adm3c22de22ef365299c3a913479
SEED_ANALYST_PASSWORD=Anl7323e05ce67165fda1c7fbf48
SEED_VIEWER_PASSWORD=Vwrd59c3d1badbd960c36a3ee8b7
```

No weak default passwords are hardcoded anywhere in the project.

## Rate Limiting

- General API limiter: `100` requests per `15` minutes.
- Auth limiter (`/api/auth/*`): `10` requests per `15` minutes.
- Both limits return `429 Too Many Requests` with JSON error responses.

## Soft Delete

- `DELETE /api/records/:id` performs a soft delete.
- The record is marked with `deletedAt` and excluded from standard list/detail queries.
- Data remains recoverable for audit/history needs and can be restored by admin flows.

## Search

- `GET /api/records` supports full-text-like filtering via `?search=`.
- Example: `/api/records?search=salary`.
- Search is combined with other filters (`type`, `category`, `startDate`, `endDate`, `page`, `limit`).

## Testing

Run the test suite:

```bash
npm test
```

Coverage includes integration tests for:

- Auth (`/api/auth/register`, `/api/auth/login`)
- Records CRUD + filtering + soft-delete behavior
- Dashboard summary/category/trends/recent endpoints
- RBAC enforcement across roles and protected routes

**Note:** Tests create their own database schema and data dynamically — no seed step needed. Each test run resets the test database.

## Design Decisions & Tradeoffs

- **TypeScript** chosen for compile-time safety — role and permission strings must match exactly across middleware and routes, and type errors catch these mismatches before runtime.
- **SQLite + Prisma** for local development; PostgreSQL for production on Render+Supabase. Switching required only a one-line datasource change in `schema.prisma` — no application code touched.
- **Permission-string RBAC** over hardcoded role checks — adding a new role or changing permissions is a config change in one file (`rbac.middleware.ts`), not a change across every route.
- **Soft delete over hard delete** — financial records should never be permanently destroyed. The `deletedAt` field preserves audit history and keeps records recoverable by admin.
- **Two-tier rate limiting** — auth endpoints have a stricter limit (10 req/15min) than the general API (100 req/15min) because login is the primary brute-force target.
- **JWT over sessions** — stateless auth means no session storage needed; the backend scales horizontally without instance coordination.
- **Seed passwords via env vars** — avoids hardcoded weak credentials even in development seed data.
- **Trust proxy enabled** — required for reverse-proxy deployments so rate limiting and IP detection work correctly.

## Production Deployment

The project is deployed on Render with Supabase PostgreSQL.

**Live URL:** https://finance-data-processing-nn74.onrender.com

**Swagger Docs:** https://finance-data-processing-nn74.onrender.com/api/docs

### Render + Supabase Setup

1. **Create Supabase project** — Get PostgreSQL connection details
2. **Set environment variables in Render dashboard:**
   - `DATABASE_URL` — Supabase PostgreSQL connection string (can use direct port 5432 or pooler port 6543; if using pooler, run migrations separately with direct connection)
   - `JWT_SECRET` — 32-byte hex string
   - `NODE_ENV` — `production`
   - `PORT` — `3000`
   - `SEED_ADMIN_PASSWORD`, `SEED_ANALYST_PASSWORD`, `SEED_VIEWER_PASSWORD` — Strong passwords
3. **Render build command:** `NODE_ENV=development npm install && npx prisma generate && npm run build`
4. **Render start command:** `node dist/server.js`
5. **Seed the database:**
   - Run `npm run seed` locally with production `DATABASE_URL`, OR
   - Connect to Supabase console and seed manually via SQL
   - **Note:** Database initialization is disabled in production (Render-Supabase connectivity issues); seeding must happen before or after deployment

### Migrating from SQLite to PostgreSQL

Only two things change:

1. Update `prisma/schema.prisma` datasource:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Set `DATABASE_URL` to a PostgreSQL connection string in your environment.

Then run:

```bash
npx prisma migrate deploy
```

No application code changes needed.

### Known Limitations in Production

- **Manual database seeding required** — Database initialization is disabled due to Render-Supabase connectivity issues. Seed must be run locally before deploying or manually via Supabase console after deployment.
- **Supabase transaction pooler compatibility** — The pgBouncer pooler (port 6543) has compatibility issues with Prisma's schema engine. Use direct connection (port 5432) for migrations; the pooler is suitable for application queries only.
- **Rate limiting is in-memory** — works for single-instance deployment; needs Redis-backed store for horizontal scaling.
- **No JWT token revocation** — tokens are valid until expiry; mitigated by 7-day expiry window.
- **Cold starts on Render** (~30s after inactivity) — acceptable for portfolio use.

## Folder Structure Overview

```text
.
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   │   ├── env.ts
│   │   └── swagger.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── rbac.middleware.ts
│   │   └── validate.middleware.ts
│   ├── modules/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── records/
│   │   └── users/
│   └── types/
│       └── express/
└── explanation.md
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript into dist/
- `npm run start` - Run compiled application
- `npm run seed` - Seed database with users and sample records
- `npm run db:migrate` - Run Prisma development migrations
- `npm run db:studio` - Open Prisma Studio to inspect the database visually
- `npm test` - Run test suite with coverage report
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint across src/
- `npm run lint:fix` - Auto-fix ESLint issues
