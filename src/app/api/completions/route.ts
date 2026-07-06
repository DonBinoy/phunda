export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getCompletions } from "@/lib/services/completions";
import { handleError, json, withDb } from "@/lib/server/http";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;
    return await withDb(async () => json(await getCompletions(from, to)));
  } catch (err) {
    return handleError(err);
  }
}
