export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { deleteExpense } from "@/lib/services/expenses";
import { handleError, noContent, withDb } from "@/lib/server/http";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return await withDb(async () => {
      await deleteExpense(id);
      return noContent();
    });
  } catch (err) {
    return handleError(err);
  }
}
