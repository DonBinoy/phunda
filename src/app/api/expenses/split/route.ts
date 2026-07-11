export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createSplitExpense } from "@/lib/services/expenses";
import { handleError, json, withDb } from "@/lib/server/http";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return await withDb(async () => json(await createSplitExpense(body), 201));
  } catch (err) {
    return handleError(err);
  }
}
