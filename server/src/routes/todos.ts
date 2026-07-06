import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { formatPgDate } from "../lib/dates.js";
import { AppError } from "../middleware/errorHandler.js";

const PERSON_IDS = ["don", "bijo", "suraj", "adithyan"] as const;
const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  personId: z.enum(PERSON_IDS),
  date: dateKeySchema,
  items: z.array(z.string().trim().min(1).max(200)).min(1).max(50),
});

export const todosRouter = Router();

function mapList(row: {
  id: string;
  title: string;
  person_id: string;
  task_date: Date | string;
  created_at: Date;
}) {
  return {
    id: row.id,
    title: row.title,
    personId: row.person_id,
    date: formatPgDate(row.task_date),
    createdAt: row.created_at.toISOString(),
  };
}

function mapItem(row: {
  id: string;
  todo_list_id: string;
  title: string;
  completed: boolean;
  sort_order: number;
  created_at: Date;
}) {
  return {
    id: row.id,
    todoListId: row.todo_list_id,
    title: row.title,
    completed: row.completed,
    sortOrder: row.sort_order,
    createdAt: row.created_at.toISOString(),
  };
}

todosRouter.get("/", async (req, res, next) => {
  try {
    const from = z.string().optional().parse(req.query.from);
    const to = z.string().optional().parse(req.query.to);

    let listQuery = `
      SELECT id, title, person_id, task_date, created_at
      FROM todo_lists
    `;
    const params: string[] = [];

    if (from && to) {
      listQuery += ` WHERE task_date BETWEEN $1::date AND $2::date`;
      params.push(from, to);
    } else if (from) {
      listQuery += ` WHERE task_date >= $1::date`;
      params.push(from);
    } else if (to) {
      listQuery += ` WHERE task_date <= $1::date`;
      params.push(to);
    }

    listQuery += ` ORDER BY task_date, created_at`;

    const { rows: lists } = await pool.query(listQuery, params);
    if (lists.length === 0) {
      res.json([]);
      return;
    }

    const ids = lists.map((l) => l.id);
    const { rows: items } = await pool.query(
      `SELECT id, todo_list_id, title, completed, sort_order, created_at
       FROM todo_items
       WHERE todo_list_id = ANY($1::uuid[])
       ORDER BY sort_order, created_at`,
      [ids],
    );

    const itemsByList = new Map<string, ReturnType<typeof mapItem>[]>();
    for (const item of items) {
      const mapped = mapItem(item);
      const arr = itemsByList.get(mapped.todoListId) ?? [];
      arr.push(mapped);
      itemsByList.set(mapped.todoListId, arr);
    }

    res.json(
      lists.map((list) => ({
        ...mapList(list),
        items: itemsByList.get(list.id) ?? [],
      })),
    );
  } catch (err) {
    next(err);
  }
});

todosRouter.post("/", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const body = createSchema.parse(req.body);
    await client.query("BEGIN");

    const { rows: listRows } = await client.query(
      `INSERT INTO todo_lists (title, person_id, task_date)
       VALUES ($1, $2, $3::date)
       RETURNING id, title, person_id, task_date, created_at`,
      [body.title, body.personId, body.date],
    );

    const list = mapList(listRows[0]);
    const items = [];

    for (let i = 0; i < body.items.length; i++) {
      const { rows } = await client.query(
        `INSERT INTO todo_items (todo_list_id, title, sort_order)
         VALUES ($1, $2, $3)
         RETURNING id, todo_list_id, title, completed, sort_order, created_at`,
        [list.id, body.items[i], i],
      );
      items.push(mapItem(rows[0]));
    }

    await client.query("COMMIT");
    res.status(201).json({ ...list, items });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

todosRouter.put("/items/:id/toggle", async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const completed = z.boolean().optional().parse(req.body?.completed);

    const existing = await pool.query<{ completed: boolean }>(
      `SELECT completed FROM todo_items WHERE id = $1`,
      [id],
    );

    if (existing.rowCount === 0) {
      throw new AppError(404, "Todo item not found");
    }

    const nextCompleted =
      completed !== undefined ? completed : !existing.rows[0].completed;

    const { rows } = await pool.query(
      `UPDATE todo_items SET completed = $2
       WHERE id = $1
       RETURNING id, todo_list_id, title, completed, sort_order, created_at`,
      [id, nextCompleted],
    );

    res.json(mapItem(rows[0]));
  } catch (err) {
    next(err);
  }
});

todosRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const result = await pool.query(
      `DELETE FROM todo_lists WHERE id = $1 RETURNING id`,
      [id],
    );

    if (result.rowCount === 0) {
      throw new AppError(404, "Todo list not found");
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
