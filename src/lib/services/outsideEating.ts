import { z } from "zod";
import { pool } from "@/lib/db/pool";
import { AppError } from "@/lib/server/errors";

const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const toggleSchema = z.object({
  date: dateKeySchema,
  active: z.boolean().optional(),
});

import { isMockDb } from "@/lib/server/isMockDb";
import { mockStore } from "@/lib/server/mockStore";

export async function getOutsideEatingDays(from?: string, to?: string) {
  if (isMockDb()) {
    return mockStore.getOutsideEatingDays(from, to);
  }
  let query = `SELECT eat_date::text AS date FROM outside_eating_days`;
  const params: string[] = [];

  if (from && to) {
    query += ` WHERE eat_date BETWEEN $1::date AND $2::date`;
    params.push(from, to);
  } else if (from) {
    query += ` WHERE eat_date >= $1::date`;
    params.push(from);
  } else if (to) {
    query += ` WHERE eat_date <= $1::date`;
    params.push(to);
  }

  query += ` ORDER BY eat_date`;

  const { rows } = await pool.query<{ date: string }>(query, params);
  return rows.map((row) => row.date);
}

export async function toggleOutsideEating(body: unknown) {
  const data = toggleSchema.parse(body);

  if (isMockDb()) {
    return mockStore.toggleOutsideEating(data.date);
  }

  const existing = await pool.query(
    `SELECT eat_date FROM outside_eating_days WHERE eat_date = $1::date`,
    [data.date],
  );

  let active: boolean;
  if (data.active !== undefined) {
    active = data.active;
  } else {
    active = existing.rowCount === 0;
  }

  if (active) {
    await pool.query(
      `INSERT INTO outside_eating_days (eat_date)
       VALUES ($1::date)
       ON CONFLICT (eat_date) DO NOTHING`,
      [data.date],
    );
  } else if (existing.rowCount === 0) {
    throw new AppError(404, "Outside eating day not found");
  } else {
    await pool.query(`DELETE FROM outside_eating_days WHERE eat_date = $1::date`, [
      data.date,
    ]);
  }

  return { date: data.date, active };
}
