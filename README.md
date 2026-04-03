# Finance Dashboard Backend

Role-based backend API for a finance dashboard with secure auth, record management, and analytics endpoints.

## Tech Stack

- TypeScript
- Node.js + Express
- Prisma ORM
- SQLite
- JWT (`jsonwebtoken`)
- Zod (request validation)
- Swagger (`swagger-jsdoc`, `swagger-ui-express`)

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

5. Seed database:

```bash
npm run seed
```

6. Start development server:

```bash
npm run dev
```

## API Documentation

Swagger UI is available at:

- `http://localhost:3000/api/docs`

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

After running `npm run seed`, these accounts are available (with passwords from your `.env`):

- Admin: `admin@finance.com` / `SEED_ADMIN_PASSWORD`
- Analyst: `analyst@finance.com` / `SEED_ANALYST_PASSWORD`
- Viewer: `viewer@finance.com` / `SEED_VIEWER_PASSWORD`

No weak default seed passwords are used.

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

## Design Decisions & Tradeoffs

- SQLite was chosen for zero-config local development; Prisma ORM keeps switching to PostgreSQL straightforward.
- Soft delete was chosen over hard delete so financial records preserve audit history.
- RBAC uses permission strings instead of hardcoded role checks per route, so adding roles/permissions is mostly a config change.
- Rate limiting is two-tiered: a general limiter for broad abuse protection and a stricter auth limiter for brute-force resistance.

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

- `npm run dev` - Start development server with hot reload.
- `npm run build` - Compile TypeScript into `dist/`.
- `npm run start` - Run compiled application.
- `npm run seed` - Seed database with users and sample records.
- `npm run db:migrate` - Run Prisma development migrations.
