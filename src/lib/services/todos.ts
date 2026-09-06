import { z } from "zod";
import { pool } from "@/lib/db/pool";
import { formatPgDate } from "@/lib/server/dates";
import { AppError } from "@/lib/server/errors";
import { parsePersonId } from "@/lib/services/validatePerson";

const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  personId: z.string().trim().min(1).max(30),
  date: dateKeySchema,
  items: z.array(z.string().trim().min(1).max(200)).min(1).max(50),
});

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

import { isMockDb } from "@/lib/server/isMockDb";
import { mockStore } from "@/lib/server/mockStore";

export async function getTodos(from?: string, to?: string) {
  if (isMockDb()) {
    return mockStore.getTodos(from, to);
  }
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
  if (lists.length === 0) return [];

  const ids = lists.map((l: { id: string }) => l.id);
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

  return lists.map((list) => ({
    ...mapList(list),
    items: itemsByList.get(list.id) ?? [],
  }));
}

export async function createTodo(body: unknown) {
  const data = createSchema.parse(body);
  const personId = await parsePersonId(data.personId);

  if (isMockDb()) {
    return mockStore.createTodo({
      title: data.title,
      personId,
      date: data.date,
      items: data.items,
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows: listRows } = await client.query(
      `INSERT INTO todo_lists (title, person_id, task_date)
       VALUES ($1, $2, $3::date)
       RETURNING id, title, person_id, task_date, created_at`,
      [data.title, personId, data.date],
    );

    const list = mapList(listRows[0]);
    const items = [];

    for (let i = 0; i < data.items.length; i++) {
      const { rows } = await client.query(
        `INSERT INTO todo_items (todo_list_id, title, sort_order)
         VALUES ($1, $2, $3)
         RETURNING id, todo_list_id, title, completed, sort_order, created_at`,
        [list.id, data.items[i], i],
      );
      items.push(mapItem(rows[0]));
    }

    await client.query("COMMIT");
    return { ...list, items };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function toggleTodoItem(id: string, body: unknown) {
  const parsedId = z.string().uuid().parse(id);
  const completed = z
    .object({ completed: z.boolean().optional() })
    .parse(body ?? {}).completed;

  if (isMockDb()) {
    return mockStore.toggleTodoItem(parsedId, completed);
  }

  const existing = await pool.query<{ completed: boolean }>(
    `SELECT completed FROM todo_items WHERE id = $1`,
    [parsedId],
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
    [parsedId, nextCompleted],
  );

  return mapItem(rows[0]);
}

export async function deleteTodo(id: string) {
  const parsedId = z.string().uuid().parse(id);
  if (isMockDb()) {
    mockStore.deleteTodo(parsedId);
    return;
  }
  const result = await pool.query(
    `DELETE FROM todo_lists WHERE id = $1 RETURNING id`,
    [parsedId],
  );
  if (result.rowCount === 0) {
    throw new AppError(404, "Todo list not found");
  }
}
