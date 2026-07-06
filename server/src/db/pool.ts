import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL is not set. Copy server/.env.example to server/.env and start PostgreSQL.",
  );
}

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://postgres:don123@localhost:5432/phunda?sslmode=disable",
  max: 10,
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL error", err);
});
