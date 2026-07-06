# PHUNDA

Home task rotation and expense tracker for Don, Bijo, Suraj, and Adithyan.

## Features

- **Daily chores** — auto-rotate every day among 4 people
- **Weekend cleaning** — kitchen, bathroom, room on a 4-week cycle
- **Calendar** — view and mark tasks complete
- **Expenses** — track rupee expenses and income (stored in PostgreSQL)

## Quick start

### 1. Create database & tables

Uses the same PostgreSQL server as your other projects (`postgres` user on localhost).

```bash
npm run db:setup
```

This creates the `phunda` database (if missing) and applies the schema.

### 2. Configure environment

```bash
cp .env.example .env.local
cp server/.env.example server/.env
```

Edit `server/.env` if your postgres password differs:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/phunda?sslmode=disable
```

### 3. Install dependencies

```bash
npm install
npm install --prefix server
```

### 4. Run frontend + API together

```bash
npm run dev:all
```

- Web app: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:4000](http://localhost:4000)

## Stack

| Layer    | Tech                          |
|----------|-------------------------------|
| Frontend | Next.js, React, Tailwind CSS  |
| Backend  | Node.js, Express, TypeScript  |
| Database | PostgreSQL                    |

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/completions?from=&to=` | Task completions by date range |
| PUT | `/api/completions/toggle` | Mark task complete/incomplete |
| GET | `/api/expenses` | List expenses + totals |
| POST | `/api/expenses` | Add expense or income |
| DELETE | `/api/expenses/:id` | Remove entry |

## Run separately

```bash
# Terminal 1 — create DB (first time only)
npm run db:setup

# Terminal 2 — API
npm run dev:server

# Terminal 3 — frontend
npm run dev
```
