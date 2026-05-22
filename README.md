# Manufacturing Management System (MMS)

A web-based ERP for garment manufacturing — manages cloth inventory, production batches, cutting/stitching/ironing workflows, worker tracking, and payroll.

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | NestJS, TypeScript |
| Frontend | Next.js 14, TypeScript, Tailwind CSS, TanStack Query, Zustand |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT + Refresh Tokens (bcrypt) |

## Project Structure

```
obaby-manufacture/
├── src/                    # NestJS backend
│   ├── auth/               # JWT auth, guards, roles
│   ├── users/              # User CRUD (admin only)
│   ├── prisma/             # Shared PrismaService
│   ├── inventory/          # Cloth roll management
│   ├── vendors/            # Vendor CRUD
│   ├── material-types/     # Material type CRUD
│   ├── config/             # System config (leftover threshold)
│   ├── products/           # Product CRUD with size ranges
│   ├── batches/            # Production batch lifecycle
│   ├── cutting/            # Cutting workflow
│   ├── stitching/          # Stitching workflow
│   ├── ironing/            # Ironing workflow
│   ├── payroll/            # Ledger, rates, payroll snapshots
│   └── audit/              # Audit logging
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed data (admin user, sample data)
├── frontend/               # Next.js frontend
│   └── src/
│       ├── app/            # Pages (login, admin/*, cutting, stitching, ironing)
│       ├── components/     # UI components
│       ├── lib/            # API client (axios + interceptors)
│       ├── store/          # Zustand auth store
│       └── providers/      # TanStack Query provider
├── .env                    # Environment variables
├── package.json            # Backend dependencies
└── README.md               # This file
```

## User Roles

| Role | Access |
|------|--------|
| ADMIN | Everything — inventory, products, batches, payroll, user management |
| CUTTING | View assigned batches, enter cut quantities, complete cutting |
| STITCHING | View assigned batches, enter stitched quantities, complete stitching |
| IRON | View available stock, submit ironing quantities |

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL (local or Docker)

### 1. Start PostgreSQL

```bash
# Using Docker (easiest)
docker run --name mms-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=obaby_manufacture -p 5432:5432 -d postgres:16

# Or using Homebrew
brew install postgresql@16
brew services start postgresql@16
createdb obaby_manufacture
```

### 2. Backend Setup

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev --name init

# Seed the database (creates admin user + sample data)
npx prisma db seed

# Start backend (port 3000)
npm run start:dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3001
```

## Default Login

- **Email:** `admin@mms.local`
- **Password:** `admin123`

## Environment Variables (.env)

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/obaby_manufacture?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY_DAYS=7
```

Frontend env (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Useful Commands

### Backend

```bash
npm run start:dev          # Start with hot reload
npm run build              # Build for production
npm run start:prod         # Run production build
npm test                   # Run unit tests
npm run test:e2e           # Run e2e tests (needs DB)
```

### Prisma

```bash
npx prisma migrate dev --name <name>   # Create + apply migration
npx prisma migrate deploy              # Apply migrations (production)
npx prisma generate                    # Regenerate Prisma client
npx prisma db seed                     # Run seed script
npx prisma studio                      # Open DB GUI (browser)
npx prisma migrate reset               # Reset DB (drops all data!)
```

### Frontend

```bash
cd frontend
npm run dev                # Dev server
npm run build              # Production build
npm run start              # Start production
```

## API Endpoints

### Auth
- `POST /auth/login` — Login (public)
- `POST /auth/refresh` — Refresh token (public)
- `POST /auth/logout` — Logout (authenticated)

### Users (Admin)
- `GET/POST /users`, `PATCH/DELETE /users/:id`

### Inventory (Admin)
- `GET/POST /inventory/rolls`, `PATCH /inventory/rolls/:id`
- `GET /inventory/rolls/:id/transactions`

### Vendors & Materials (Admin)
- `GET/POST/PATCH /vendors`
- `GET/POST/PATCH /material-types`

### Products (Admin)
- `GET/POST /products`, `PATCH/DELETE /products/:id`

### Batches (Admin)
- `GET/POST /batches`, `GET /batches/:id`
- `POST /batches/:id/rolls`, `DELETE /batches/:id/rolls/:rollId`
- `POST /batches/:id/cutting-worker`, `POST /batches/:id/stitching-worker`
- `POST /batches/:id/cancel`

### Cutting (Cutting Worker + Admin)
- `GET /cutting/my-batches`, `GET /cutting/batches/:id`
- `POST /cutting/batches/:id/quantities`
- `POST /cutting/batches/:id/leftover`
- `POST /cutting/batches/:id/complete`
- `PATCH /cutting/batches/:id/quantities` (Admin only)

### Stitching (Stitching Worker + Admin)
- `GET /stitching/my-batches`, `GET /stitching/batches/:id`
- `POST /stitching/batches/:id/quantities`
- `POST /stitching/batches/:id/complete`
- `PATCH /stitching/batches/:id/quantities` (Admin only)

### Ironing (Iron Worker + Admin)
- `GET /ironing/available-stock`
- `POST /ironing/submit`
- `GET /ironing/my-entries`

### Payroll (Admin)
- `POST/GET /payroll/ledger`, `PATCH /payroll/ledger/:id`
- `POST/GET /payroll/rates`
- `GET /payroll/calculate/:workerId?month=YYYY-MM`
- `POST /payroll/finalize`
- `GET /payroll/snapshots`

### Config (Admin)
- `GET/PUT /config/leftover-threshold`

### Audit Logs (Admin)
- `GET /audit-logs`

## Production Workflow

```
Inventory Rolls → Product Creation → Batch Creation → Roll Assignment
    → Cutting (worker enters quantities) → Stitching (worker enters quantities)
    → Ironing (workers pick from available stock) → Batch Completed
```

## Seed Data

After running `npx prisma db seed`:
- 1 admin user (admin@mms.local)
- 4 vendors (Arvind Mills, Raymond, Bombay Dyeing, Vardhman Textiles)
- 4 material types (Cotton, Polyester, Silk, Linen)
- 3 sample cloth rolls
- Leftover threshold config (0.5 meters)
