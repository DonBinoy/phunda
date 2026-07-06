import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { AppError } from "../middleware/errorHandler.js";

const DAILY_TASKS = ["paathram", "veg", "kari", "rice"] as const;
const WEEKEND_TASKS = ["kitchen", "bathroom", "room"] as const;

const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const toggleSchema = z.object({
  date: dateKeySchema,
  category: z.enum(["daily", "weekend"]),
  taskId: z.string(),
  completed: z.boolean().optional(),
});

export const completionsRouter = Router();

completionsRouter.get("/", async (req, res, next) => {
  try {
    const from = z.string().optional().parse(req.query.from);
    const to = z.string().optional().parse(req.query.to);

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

    res.json(store);
  } catch (err) {
    next(err);
  }
});

completionsRouter.put("/toggle", async (req, res, next) => {
  try {
    const body = toggleSchema.parse(req.body);

    const validTasks: readonly string[] =
      body.category === "daily" ? DAILY_TASKS : WEEKEND_TASKS;
    if (!validTasks.includes(body.taskId)) {
      throw new AppError(400, `Invalid task id: ${body.taskId}`);
    }

    const existing = await pool.query<{ completed: boolean }>(
      `SELECT completed FROM task_completions
       WHERE task_date = $1::date AND category = $2 AND task_id = $3`,
      [body.date, body.category, body.taskId],
    );

    let completed: boolean;
    if (body.completed !== undefined) {
      completed = body.completed;
    } else if (existing.rows[0]) {
      completed = !existing.rows[0].completed;
    } else {
      completed = true;
    }

    if (completed) {
      await pool.query(
        `INSERT INTO task_completions (task_date, category, task_id, completed, updated_at)
         VALUES ($1::date, $2, $3, TRUE, NOW())
         ON CONFLICT (task_date, category, task_id)
         DO UPDATE SET completed = TRUE, updated_at = NOW()`,
        [body.date, body.category, body.taskId],
      );
    } else {
      await pool.query(
        `INSERT INTO task_completions (task_date, category, task_id, completed, updated_at)
         VALUES ($1::date, $2, $3, FALSE, NOW())
         ON CONFLICT (task_date, category, task_id)
         DO UPDATE SET completed = FALSE, updated_at = NOW()`,
        [body.date, body.category, body.taskId],
      );
    }

    res.json({
      date: body.date,
      category: body.category,
      taskId: body.taskId,
      completed,
    });
  } catch (err) {
    next(err);
  }
});
