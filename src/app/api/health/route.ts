export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { pool } from "@/lib/db/pool";
import { handleError, json, withDb } from "@/lib/server/http";

export async function GET() {
  try {
    return await withDb(async () => {
      await pool.query("SELECT 1");
      return json({ status: "ok", service: "phunda-api" });
    });
  } catch (err) {
    return handleError(err);
  }
}
