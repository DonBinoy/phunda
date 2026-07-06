import { createTodo, getTodos } from "@/lib/services/todos";
import { handleError, json, withDb } from "@/lib/server/http";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;
    return await withDb(async () => json(await getTodos(from, to)));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return await withDb(async () => json(await createTodo(body), 201));
  } catch (err) {
    return handleError(err);
  }
}
