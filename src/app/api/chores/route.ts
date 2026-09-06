export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createChore, getChores } from "@/lib/services/chores";
import { handleError, json, withDb } from "@/lib/server/http";

export async function GET() {
  try {
    return await withDb(async () => json(await getChores()));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return await withDb(async () => json(await createChore(body), 201));
  } catch (err) {
    return handleError(err);
  }
}
