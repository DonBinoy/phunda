import { deleteCustomTask } from "@/lib/services/customTasks";
import { handleError, noContent, withDb } from "@/lib/server/http";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return await withDb(async () => {
      await deleteCustomTask(id);
      return noContent();
    });
  } catch (err) {
    return handleError(err);
  }
}
