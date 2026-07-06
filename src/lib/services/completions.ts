import { z } from "zod";
import { pool } from "@/lib/db/pool";
import { AppError } from "@/lib/server/errors";

const DAILY_TASKS = ["paathram", "veg", "kari", "rice"] as const;
const WEEKEND_TASKS = ["kitchen", "bathroom", "room"] as const;
const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const toggleSchema = z.object({
  date: dateKeySchema,
  category: z.enum(["daily", "weekend"]),
  taskId: z.string(),
  completed: z.boolean().optional(),
});

export async function getCompletions(from?: string, to?: string) {
  let query = `
    SELECT task_date::text AS date, category, task_id, completed
    FROM task_completions
  `;
  const params: string[] = [];

  if (from && to) {
    query += ` WHERE task_date BETWEEN $1::date AND $2::date`;
    params.push(from, to);
  } else if (from) {
    query += ` WHERE task_date >= $1::date`;
    params.push(from);
  } else if (to) {
    query += ` WHERE task_date <= $1::date`;
    params.push(to);
  }

  query += ` ORDER BY task_date`;

  const { rows } = await pool.query<{
    date: string;
    category: "daily" | "weekend";
    task_id: string;
    completed: boolean;
  }>(query, params);

  const store: Record<
    string,
    { daily: Record<string, boolean>; weekend: Record<string, boolean> }
  > = {};

  for (const row of rows) {
    if (!store[row.date]) {
      store[row.date] = { daily: {}, weekend: {} };
    }
    if (row.completed) {
      store[row.date][row.category][row.task_id] = true;
    }
  }

  return store;
}

export async function toggleCompletion(body: unknown) {
  const data = toggleSchema.parse(body);
  const validTasks: readonly string[] =
    data.category === "daily" ? DAILY_TASKS : WEEKEND_TASKS;

  if (!validTasks.includes(data.taskId)) {
    throw new AppError(400, `Invalid task id: ${data.taskId}`);
  }

  const existing = await pool.query<{ completed: boolean }>(
    `SELECT completed FROM task_completions
     WHERE task_date = $1::date AND category = $2 AND task_id = $3`,
    [data.date, data.category, data.taskId],
  );

  let completed: boolean;
  if (data.completed !== undefined) {
    completed = data.completed;
  } else if (existing.rows[0]) {
    completed = !existing.rows[0].completed;
  } else {
    completed = true;
  }

  await pool.query(
    `INSERT INTO task_completions (task_date, category, task_id, completed, updated_at)
     VALUES ($1::date, $2, $3, $4, NOW())
     ON CONFLICT (task_date, category, task_id)
     DO UPDATE SET completed = $4, updated_at = NOW()`,
    [data.date, data.category, data.taskId, completed],
  );

  return {
    date: data.date,
    category: data.category,
    taskId: data.taskId,
    completed,
  };
}
