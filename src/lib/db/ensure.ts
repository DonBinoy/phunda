import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pool } from "./pool";

let ready = false;

export async function ensureDb() {
  if (ready) return;
  const schema = readFileSync(join(process.cwd(), "src/lib/db/schema.sql"), "utf-8");
  await pool.query(schema);
  ready = true;
}
