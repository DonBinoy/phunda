export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { toggleOutsideEating } from "@/lib/services/outsideEating";
import { handleError, json, withDb } from "@/lib/server/http";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    return await withDb(async () => json(await toggleOutsideEating(body)));
  } catch (err) {
    return handleError(err);
  }
}
