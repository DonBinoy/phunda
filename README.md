# PHUNDA

Home task rotation and expense tracker for Don, Bijo, Suraj, and Adithyan.

**Frontend + API** run together as one **Next.js** app — ideal for **Vercel** deployment from a single repo.

## Features

- Daily chores with auto-rotation
- Weekend cleaning (extra on Sat/Sun)
- Custom tasks & todo lists
- Expense/income tracking per person
- PostgreSQL storage

## Local setup

### 1. Install

```bash
npm install
```

### 2. Environment

```bash
cp .env.example .env.local
```

Edit `DATABASE_URL` in `.env.local` to point at your PostgreSQL database.

### 3. Create database & tables

```bash
npm run db:setup
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). API routes live at `/api/*` on the same server — **no CORS**.

## Deploy on Vercel

1. Push this repo to GitHub and import in [Vercel](https://vercel.com).
2. Add a **PostgreSQL** database (Neon, Supabase, Vercel Postgres, or your own).
3. In Vercel → **Settings → Environment Variables**, set:

| Variable | Example |
|----------|---------|
| `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` |

4. Run schema once against production DB (from your machine):

```bash
DATABASE_URL="your-production-url" npm run db:setup
```

5. **Redeploy** on Vercel.

No `NEXT_PUBLIC_API_URL`, no CORS, no separate API server needed.

## API routes

| Method | Path |
|--------|------|
| GET | `/api/health` |
| GET | `/api/completions` |
| PUT | `/api/completions/toggle` |
| GET/POST | `/api/expenses` |
| DELETE | `/api/expenses/[id]` |
| GET/POST | `/api/custom-tasks` |
| PUT | `/api/custom-tasks/[id]/toggle` |
| DELETE | `/api/custom-tasks/[id]` |
| GET/POST | `/api/todos` |
| PUT | `/api/todos/items/[id]/toggle` |
| DELETE | `/api/todos/[id]` |

## Stack

Next.js · React · Tailwind CSS · PostgreSQL · Vercel Serverless
