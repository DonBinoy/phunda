import pg from "pg";

const { Pool } = pg;

const globalForPg = globalThis as typeof globalThis & { pgPool?: pg.Pool };

export function getDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    undefined
  );
}

function resolveSsl(connectionString: string): false | { rejectUnauthorized: boolean } {
  if (connectionString.includes("sslmode=disable")) return false;
  if (connectionString.includes("localhost") || connectionString.includes("127.0.0.1")) {
    return false;
  }
  return { rejectUnauthorized: false };
}

function createPool(): pg.Pool {
  const connectionString =
    getDatabaseUrl() ??
    "postgresql://postgres:don123@localhost:5432/phunda?sslmode=disable";

  return new Pool({
    connectionString,
    ssl: resolveSsl(connectionString),
    max: process.env.VERCEL ? 1 : 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
}

export const pool = globalForPg.pgPool ?? createPool();

if (!globalForPg.pgPool) {
  globalForPg.pgPool = pool;
}

pool.on("error", (err) => {
  console.error("PostgreSQL pool error:", err);
});
