export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { ensureDb } from "@/lib/db/ensure";
import { getDatabaseUrl, pool } from "@/lib/db/pool";
import { json } from "@/lib/server/http";

export async function GET() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    return json(
      {
        status: "error",
        service: "phunda-api",
        error: "DATABASE_URL is not configured on Vercel",
      },
      503,
    );
  }

  try {
    await ensureDb();
    await pool.query("SELECT 1");
    return json({
      status: "ok",
      service: "phunda-api",
      database: "connected",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown database error";
    console.error("Health check failed:", err);
    return json(
      {
        status: "error",
        service: "phunda-api",
        error: message,
      },
      503,
    );
  }
}
