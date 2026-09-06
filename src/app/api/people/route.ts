export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createPerson, getPeople } from "@/lib/services/people";
import { handleError, json, withDb } from "@/lib/server/http";

export async function GET() {
  try {
    return await withDb(async () => json(await getPeople()));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return await withDb(async () => json(await createPerson(body), 201));
  } catch (err) {
    return handleError(err);
  }
}
