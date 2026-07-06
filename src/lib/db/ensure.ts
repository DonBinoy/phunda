import { SCHEMA_SQL } from "./schema";
import { pool } from "./pool";

const globalForDb = globalThis as typeof globalThis & { dbReady?: boolean };

export async function ensureDb() {
  if (globalForDb.dbReady) return;
  await pool.query(SCHEMA_SQL);
  globalForDb.dbReady = true;
}
