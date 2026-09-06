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
});

function mapRow(row: {
  id: string;
  title: string;
  person_id: string;
  task_date: Date | string;
  completed: boolean;
  created_at: Date;
}) {
  return {
    id: row.id,
    title: row.title,
    personId: row.person_id,
    date: formatPgDate(row.task_date),
    completed: row.completed,
    createdAt: row.created_at.toISOString(),
  };
}

import { isMockDb } from "@/lib/server/isMockDb";
import { mockStore } from "@/lib/server/mockStore";

export async function getCustomTasks(from?: string, to?: string) {
  if (isMockDb()) {
    return mockStore.getCustomTasks(from, to);
  }
  let query = `
    SELECT id, title, person_id, task_date::text AS date, completed, created_at
    FROM custom_tasks
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

  query += ` ORDER BY task_date, created_at`;
  const { rows } = await pool.query(query, params);
  return rows.map(mapRow);
}

export async function createCustomTask(body: unknown) {
  const data = createSchema.parse(body);
  const personId = await parsePersonId(data.personId);

  if (isMockDb()) {
    return mockStore.createCustomTask({
      title: data.title,
      personId,
      date: data.date,
    });
  }
  const { rows } = await pool.query(
    `INSERT INTO custom_tasks (title, person_id, task_date)
     VALUES ($1, $2, $3::date)
     RETURNING id, title, person_id, task_date, completed, created_at`,
    [data.title, personId, data.date],
  );
  return mapRow(rows[0]);
}

export async function toggleCustomTask(id: string, body: unknown) {
  const parsedId = z.string().uuid().parse(id);
  const completed = z
    .object({ completed: z.boolean().optional() })
    .parse(body ?? {}).completed;

  if (isMockDb()) {
    return mockStore.toggleCustomTask(parsedId, completed);
  }

  const existing = await pool.query<{ completed: boolean }>(
    `SELECT completed FROM custom_tasks WHERE id = $1`,
    [parsedId],
  );

  if (existing.rowCount === 0) {
    throw new AppError(404, "Task not found");
  }

  const nextCompleted =
    completed !== undefined ? completed : !existing.rows[0].completed;

  const { rows } = await pool.query(
    `UPDATE custom_tasks SET completed = $2
     WHERE id = $1
     RETURNING id, title, person_id, task_date, completed, created_at`,
    [parsedId, nextCompleted],
  );

  return mapRow(rows[0]);
}

export async function deleteCustomTask(id: string) {
  const parsedId = z.string().uuid().parse(id);
  if (isMockDb()) {
    mockStore.deleteCustomTask(parsedId);
    return;
  }
  const result = await pool.query(
    `DELETE FROM custom_tasks WHERE id = $1 RETURNING id`,
    [parsedId],
  );
  if (result.rowCount === 0) {
    throw new AppError(404, "Task not found");
  }
}
