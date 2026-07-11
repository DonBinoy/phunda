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
    let message = err instanceof Error ? err.message : "Unknown database error";
    if (
      message.includes("ENOTFOUND") &&
      message.includes("db.") &&
      message.includes(".supabase.co")
    ) {
      message =
        "Direct Supabase host (db.*.supabase.co) is IPv6-only and does not work on Vercel. " +
        "In Vercel, set DATABASE_URL to the Transaction pooler string from Supabase → " +
        "Settings → Database → Connection string (host: aws-0-[region].pooler.supabase.com, port 6543).";
    }
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
