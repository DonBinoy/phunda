import pg from "pg";
import {
  EXPENSE_TEMPLATES_TABLE_SQL,
  OUTSIDE_EATING_TABLE_SQL,
  SCHEMA_SQL,
} from "./schema";
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

async function tableExists(tableName: string): Promise<boolean> {
  const { rows } = await pool.query<{ ok: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name = $1
     ) AS ok`,
    [tableName],
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

async function ensureMigrations() {
  if (!(await tableExists("outside_eating_days"))) {
    const schemaUrl = getSchemaConnectionString();
    if (schemaUrl) {
      const client = new pg.Client({
        connectionString: schemaUrl,
        ssl: resolveSsl(schemaUrl),
      });
      try {
        await client.connect();
        await client.query(OUTSIDE_EATING_TABLE_SQL);
      } finally {
        await client.end();
      }
    } else {
      await pool.query(OUTSIDE_EATING_TABLE_SQL);
    }
  }

  if (!(await tableExists("expense_templates"))) {
    await pool.query(EXPENSE_TEMPLATES_TABLE_SQL);
  }
}

export async function ensureDb() {
  if (globalForDb.dbReady) {
    await ensureMigrations();
    return;
  }

  if (await tableExists("task_completions")) {
    await ensureMigrations();
    globalForDb.dbReady = true;
    return;
  }

  const schemaUrl = getSchemaConnectionString();
  if (!schemaUrl) {
    throw new Error(SCHEMA_SETUP_HINT);
  }

  await runSchema(schemaUrl);

  if (!(await tableExists("task_completions"))) {
    throw new Error(SCHEMA_SETUP_HINT);
  }

  await ensureMigrations();
  globalForDb.dbReady = true;
}
