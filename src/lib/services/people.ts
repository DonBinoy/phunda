import { z } from "zod";
import { pool } from "@/lib/db/pool";
import { AppError } from "@/lib/server/errors";
import { uniqueSlug } from "@/lib/server/slugify";

export interface PersonRow {
  id: string;
  name: string;
  baselineTaskIndex: number;
  sortOrder: number;
  createdAt: string;
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

function mapRow(row: {
  id: string;
  name: string;
  baseline_task_index: number;
  sort_order: number;
  created_at: Date;
}): PersonRow {
  return {
    id: row.id,
    name: row.name,
    baselineTaskIndex: row.baseline_task_index,
    sortOrder: row.sort_order,
    createdAt: row.created_at.toISOString(),
  };
}

import { isMockDb } from "@/lib/server/isMockDb";
import { mockStore } from "@/lib/server/mockStore";

export async function getPeople(): Promise<PersonRow[]> {
  if (isMockDb()) {
    return mockStore.getPeople();
  }
  const { rows } = await pool.query(
    `SELECT id, name, baseline_task_index, sort_order, created_at
     FROM people
     ORDER BY sort_order, created_at`,
  );
  return rows.map(mapRow);
}

export async function getPersonIds(): Promise<string[]> {
  const people = await getPeople();
  return people.map((p) => p.id);
}

export async function personExists(id: string): Promise<boolean> {
  if (isMockDb()) {
    return mockStore.personExists(id);
  }
  const { rows } = await pool.query<{ ok: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM people WHERE id = $1) AS ok`,
    [id],
  );
  return rows[0]?.ok === true;
}

export async function assertPersonExists(id: string) {
  if (!(await personExists(id))) {
    throw new AppError(400, `Unknown person: ${id}`);
  }
}

export async function createPerson(body: unknown): Promise<PersonRow> {
  const data = createSchema.parse(body);

  if (isMockDb()) {
    return mockStore.createPerson(data.name);
  }

  const { rows: countRows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM people`,
  );
  const sortOrder = Number(countRows[0]?.count ?? 0);

  const { rows: taskRows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM chore_definitions WHERE category = 'daily'`,
  );
  const dailyCount = Math.max(Number(taskRows[0]?.count ?? 1), 1);
  const baselineTaskIndex = sortOrder % dailyCount;

  const id = await uniqueSlug(data.name, async (candidate) => {
    const { rows } = await pool.query(
      `SELECT 1 FROM people WHERE id = $1`,
      [candidate],
    );
    return rows.length > 0;
  });

  const { rows } = await pool.query(
    `INSERT INTO people (id, name, baseline_task_index, sort_order)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, baseline_task_index, sort_order, created_at`,
    [id, data.name, baselineTaskIndex, sortOrder],
  );

  return mapRow(rows[0]);
}
