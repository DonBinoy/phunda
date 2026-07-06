import pg from "pg";

const { Pool } = pg;

const globalForPg = globalThis as typeof globalThis & { pgPool?: pg.Pool };

function buildConnectionString() {
  return (
    process.env.DATABASE_URL ??
    "postgresql://postgres:don123@localhost:5432/phunda?sslmode=disable"
  );
}

function useSsl(connectionString: string) {
  if (connectionString.includes("sslmode=disable")) return false;
  if (connectionString.includes("localhost")) return false;
  return { rejectUnauthorized: false };
}

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: buildConnectionString(),
    ssl: useSsl(buildConnectionString()),
    max: 5,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}

pool.on("error", (err) => {
  console.error("PostgreSQL pool error:", err);
});
