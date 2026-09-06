import { z } from "zod";
import { pool } from "@/lib/db/pool";
import { buildSplitShares } from "@/lib/expenses/split";
import { AppError } from "@/lib/server/errors";
import { getPersonIds } from "@/lib/services/people";
import {
  parseOptionalPersonId,
  parsePersonId,
  parsePersonIdList,
} from "@/lib/services/validatePerson";

const createSchema = z
  .object({
    type: z.enum(["expense", "income"]),
    amount: z.number().positive(),
    comment: z.string().trim().min(1).max(500),
    personId: z.string().trim().min(1).max(30).optional(),
  })
  .refine((data) => data.type !== "income" || !!data.personId, {
    message: "personId is required for income entries",
    path: ["personId"],
  });

const splitSchema = z.object({
  amount: z.number().positive(),
  comment: z.string().trim().min(1).max(500),
  personIds: z.array(z.string().trim().min(1).max(30)).min(2).optional(),
});

function mapRow(row: {
  id: string;
  type: "expense" | "income";
  amount: string;
  comment: string;
  person_id: string | null;
  created_at: Date;
}) {
  return {
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    comment: row.comment,
    personId: row.person_id ?? undefined,
    createdAt: row.created_at.toISOString(),
  };
}

async function computeTotals(entries: ReturnType<typeof mapRow>[]) {
  const personIds = await getPersonIds();
  let expense = 0;
  let income = 0;
  const byPerson: Record<
    string,
    { income: number; expense: number; balance: number }
  > = {};

  for (const id of personIds) {
    byPerson[id] = { income: 0, expense: 0, balance: 0 };
  }

  for (const e of entries) {
    if (e.type === "expense") expense += e.amount;
    else income += e.amount;

    if (e.personId && byPerson[e.personId]) {
      if (e.type === "expense") byPerson[e.personId].expense += e.amount;
      else byPerson[e.personId].income += e.amount;
    }
  }

  for (const id of personIds) {
    byPerson[id].balance = byPerson[id].income - byPerson[id].expense;
  }

  return { expense, income, balance: income - expense, byPerson };
}

import { isMockDb } from "@/lib/server/isMockDb";
import { mockStore } from "@/lib/server/mockStore";

export async function getExpenses() {
  if (isMockDb()) {
    return mockStore.getExpenses();
  }
  const { rows } = await pool.query(
    `SELECT id, type, amount, comment, person_id, created_at
     FROM expense_entries
     ORDER BY created_at DESC`,
  );
  const entries = rows.map(mapRow);
  return { entries, totals: await computeTotals(entries) };
}

export async function createExpense(body: unknown) {
  const data = createSchema.parse(body);
  const personId = data.personId
    ? await parsePersonId(data.personId)
    : undefined;

  if (isMockDb()) {
    return mockStore.createExpense({
      type: data.type,
      amount: data.amount,
      comment: data.comment,
      personId,
    });
  }

  const { rows } = await pool.query(
    `INSERT INTO expense_entries (type, amount, comment, person_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, type, amount, comment, person_id, created_at`,
    [data.type, data.amount, data.comment, personId ?? null],
  );
  return mapRow(rows[0]);
}

export async function createSplitExpense(body: unknown) {
  const data = splitSchema.parse(body);
  const members =
    data.personIds !== undefined
      ? await parsePersonIdList(data.personIds, 2)
      : await getPersonIds();

  if (isMockDb()) {
    return mockStore.createSplitExpense({
      amount: data.amount,
      comment: data.comment,
      personIds: members,
    });
  }

  const shares = buildSplitShares(data.amount, members);
  const splitComment = `${data.comment} (split equally)`;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const created = [];

    for (const { personId, amount } of shares) {
      const { rows } = await client.query(
        `INSERT INTO expense_entries (type, amount, comment, person_id)
         VALUES ('expense', $1, $2, $3)
         RETURNING id, type, amount, comment, person_id, created_at`,
        [amount, splitComment, personId],
      );
      created.push(mapRow(rows[0]));
    }

    await client.query("COMMIT");
    return created;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteExpense(id: string) {
  const parsed = z.string().uuid().parse(id);
  if (isMockDb()) {
    mockStore.deleteExpense(parsed);
    return;
  }
  const result = await pool.query(
    `DELETE FROM expense_entries WHERE id = $1 RETURNING id`,
    [parsed],
  );
  if (result.rowCount === 0) {
    throw new AppError(404, "Entry not found");
  }
}
