import { z } from "zod";
import { pool } from "@/lib/db/pool";
import { uniqueSlug } from "@/lib/server/slugify";

export interface ChoreRow {
  id: string;
  name: string;
  shortName: string;
  category: "daily" | "weekend";
  slots: number;
  sortOrder: number;
  createdAt: string;
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(200),
  shortName: z.string().trim().min(1).max(100).optional(),
  category: z.enum(["daily", "weekend"]),
  slots: z.number().int().min(1).max(10).optional(),
});

function mapRow(row: {
  id: string;
  name: string;
  short_name: string;
  category: "daily" | "weekend";
  slots: number;
  sort_order: number;
  created_at: Date;
}): ChoreRow {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    category: row.category,
    slots: row.slots,
    sortOrder: row.sort_order,
    createdAt: row.created_at.toISOString(),
  };
}

import { isMockDb } from "@/lib/server/isMockDb";
import { mockStore } from "@/lib/server/mockStore";

export async function getChores(): Promise<ChoreRow[]> {
  if (isMockDb()) {
    return mockStore.getChores();
  }
  const { rows } = await pool.query(
    `SELECT id, name, short_name, category, slots, sort_order, created_at
     FROM chore_definitions
     ORDER BY category, sort_order, created_at`,
  );
  return rows.map(mapRow);
}

export async function getChoreIds(
  category?: "daily" | "weekend",
): Promise<string[]> {
  const chores = await getChores();
  return chores
    .filter((c) => !category || c.category === category)
    .map((c) => c.id);
}

export async function choreExists(id: string): Promise<boolean> {
  if (isMockDb()) {
    return mockStore.choreExists(id);
  }
  const { rows } = await pool.query<{ ok: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM chore_definitions WHERE id = $1) AS ok`,
    [id],
  );
  return rows[0]?.ok === true;
}

export async function createChore(body: unknown): Promise<ChoreRow> {
  const data = createSchema.parse(body);

  if (isMockDb()) {
    return mockStore.createChore(data);
  }
  const shortName = data.shortName?.trim() || data.name.trim();

  const { rows: countRows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM chore_definitions WHERE category = $1`,
    [data.category],
  );
  const sortOrder = Number(countRows[0]?.count ?? 0);
  const slots = data.category === "weekend" ? (data.slots ?? 1) : 1;

  const id = await uniqueSlug(data.name, async (candidate) => {
    const { rows } = await pool.query(
      `SELECT 1 FROM chore_definitions WHERE id = $1`,
      [candidate],
    );
    return rows.length > 0;
  });

  const { rows } = await pool.query(
    `INSERT INTO chore_definitions (id, name, short_name, category, slots, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, short_name, category, slots, sort_order, created_at`,
    [id, data.name, shortName, data.category, slots, sortOrder],
  );

  return mapRow(rows[0]);
}
