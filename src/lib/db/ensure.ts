import pg from "pg";
import { SCHEMA_SQL } from "./schema";
import { getDatabaseUrl, isPoolerUrl, pool } from "./pool";

const globalForDb = globalThis as typeof globalThis & { dbReady?: boolean };

const SCHEMA_SETUP_HINT =
  "Database tables are missing. In Supabase Dashboard → SQL Editor, run src/lib/db/schema.sql once, then redeploy.";

function resolveSsl(connectionString: string): false | { rejectUnauthorized: boolean } {
  if (connectionString.includes("sslmode=disable")) return false;
  if (connectionString.includes("localhost") || connectionString.includes("127.0.0.1")) {
    return false;
  }
  return { rejectUnauthorized: false };
}

async function tablesExist(): Promise<boolean> {
  const { rows } = await pool.query<{ ok: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name = 'task_completions'
     ) AS ok`,
  );
  return rows[0]?.ok === true;
}

async function runSchema(connectionString: string) {
  const client = new pg.Client({
    connectionString,
    ssl: resolveSsl(connectionString),
  });

  try {
    await client.connect();
    await client.query(SCHEMA_SQL);
  } finally {
    await client.end();
  }
}

function getSchemaConnectionString(): string | undefined {
  const directUrl =
    process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_DIRECT_URL;
  const appUrl = getDatabaseUrl();

  if (directUrl && !isPoolerUrl(directUrl)) return directUrl;
  if (appUrl && !isPoolerUrl(appUrl)) return appUrl;
  return undefined;
}

export async function ensureDb() {
  if (globalForDb.dbReady) return;

  if (await tablesExist()) {
    globalForDb.dbReady = true;
    return;
  }

  const schemaUrl = getSchemaConnectionString();
  if (!schemaUrl) {
    throw new Error(SCHEMA_SETUP_HINT);
  }

  await runSchema(schemaUrl);

  if (!(await tablesExist())) {
    throw new Error(SCHEMA_SETUP_HINT);
  }

  globalForDb.dbReady = true;
}
