export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { deleteExpenseTemplate } from "@/lib/services/expenseTemplates";
import { handleError, json, withDb } from "@/lib/server/http";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    return await withDb(async () => {
      await deleteExpenseTemplate(id);
      return json({ ok: true });
    });
  } catch (err) {
    return handleError(err);
  }
}
