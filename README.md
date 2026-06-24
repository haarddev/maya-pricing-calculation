# Maya Pricing Calculation

Travel pricing management system for Israel — template-based pricing with English/Hebrew and LTR/RTL support.

## Stack

- **Frontend:** React, Vite, TypeScript, MUI, i18next
- **Backend:** Node.js, Express, TypeScript, Prisma
- **Database:** PostgreSQL 16

## Prerequisites

- Node.js 18+
- Docker Desktop (for PostgreSQL)

## Quick start

### 1. Start PostgreSQL

Start Docker Desktop, then run:

```bash
docker compose up -d
```

PostgreSQL runs on port **5433** (Docker). If you already have local PostgreSQL on port **5432**, update `backend/.env` instead:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/maya_pricing
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run seed
npm run dev
```

Backend runs at `http://localhost:4000`.

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Default dev credentials

| Email | Password |
|-------|----------|
| admin@maya.local | Admin123! |

## API overview

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register (dev) |
| GET | `/api/auth/me` | Current user |
| GET | `/api/templates` | List templates |
| POST | `/api/templates` | Create template |
| GET | `/api/templates/:id` | Get template |
| PUT | `/api/templates/:id` | Update template |
| DELETE | `/api/templates/:id` | Delete template |

All template routes require `Authorization: Bearer <token>`.

## Project structure

```
maya-pricing-calculation/
├── docker-compose.yml
├── frontend/          # React + Vite + TS
└── backend/           # Express + TS + Prisma
```
