import { toggleTodoItem } from "@/lib/services/todos";
import { handleError, json, withDb } from "@/lib/server/http";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    return await withDb(async () => json(await toggleTodoItem(id, body)));
  } catch (err) {
    return handleError(err);
  }
}
