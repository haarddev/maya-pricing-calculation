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


## Project structure

```
maya-pricing-calculation/
├── docker-compose.yml
├── frontend/          # React + Vite + TS
└── backend/           # Express + TS + Prisma
```
