import pg from "pg";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const ADMIN_URL =
  process.env.DATABASE_ADMIN_URL ??
  "postgresql://postgres:don123@localhost:5432/postgres?sslmode=disable";

const APP_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:don123@localhost:5432/phunda?sslmode=disable";

function dbNameFromUrl(url: string): string {
  const parsed = new URL(url.replace("postgresql://", "http://"));
  return parsed.pathname.replace(/^\//, "") || "phunda";
}

async function ensureDatabase() {
  const dbName = dbNameFromUrl(APP_URL);
  const admin = new pg.Client({ connectionString: ADMIN_URL });
  await admin.connect();

  const exists = await admin.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [dbName],
  );

  if (exists.rowCount === 0) {
    await admin.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Created database "${dbName}".`);
  } else {
    console.log(`Database "${dbName}" already exists.`);
  }

  await admin.end();
}

async function runSchema() {
  const schema = readFileSync(join(__dirname, "schema.sql"), "utf-8");
  const app = new pg.Client({ connectionString: APP_URL });
  await app.connect();
  await app.query(schema);
  await app.end();
  console.log("Schema applied to phunda.");
}

async function main() {
  console.log("Setting up PHUNDA database...");
  await ensureDatabase();
  await runSchema();
  console.log("Done.");
}

main().catch((err) => {
  console.error("Setup failed:", err.message);
  process.exit(1);
});
