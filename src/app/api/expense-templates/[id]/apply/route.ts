export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { applyExpenseTemplate } from "@/lib/services/expenseTemplates";
import { handleError, json, withDb } from "@/lib/server/http";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    return await withDb(async () => {
      const result = await applyExpenseTemplate(id, body);
      return json(result, 201);
    });
  } catch (err) {
    return handleError(err);
  }
}
