import { toggleCompletion } from "@/lib/services/completions";
import { handleError, json, withDb } from "@/lib/server/http";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    return await withDb(async () => json(await toggleCompletion(body)));
  } catch (err) {
    return handleError(err);
  }
}
