import { toggleCustomTask } from "@/lib/services/customTasks";
import { handleError, json, withDb } from "@/lib/server/http";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    return await withDb(async () => json(await toggleCustomTask(id, body)));
  } catch (err) {
    return handleError(err);
  }
}
