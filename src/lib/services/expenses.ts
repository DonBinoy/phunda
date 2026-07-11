import { z } from "zod";
import { pool } from "@/lib/db/pool";
import { PERSON_IDS } from "@/lib/constants";
import { buildSplitShares } from "@/lib/expenses/split";
import { AppError } from "@/lib/server/errors";

const PERSON_ID_ENUM = ["don", "bijo", "suraj", "adithyan"] as const;

const createSchema = z
  .object({
    type: z.enum(["expense", "income"]),
    amount: z.number().positive(),
    comment: z.string().trim().min(1).max(500),
    personId: z.enum(PERSON_ID_ENUM).optional(),
  })
  .refine((data) => data.type !== "income" || !!data.personId, {
    message: "personId is required for income entries",
    path: ["personId"],
  });

const splitSchema = z.object({
  amount: z.number().positive(),
  comment: z.string().trim().min(1).max(500),
  personIds: z.array(z.enum(PERSON_ID_ENUM)).min(2).optional(),
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

function computeTotals(entries: ReturnType<typeof mapRow>[]) {
  let expense = 0;
  let income = 0;
  const byPerson: Record<
    string,
    { income: number; expense: number; balance: number }
  > = {};

  for (const id of PERSON_IDS) {
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

  for (const id of PERSON_IDS) {
    byPerson[id].balance = byPerson[id].income - byPerson[id].expense;
  }

  return { expense, income, balance: income - expense, byPerson };
}

export async function getExpenses() {
  const { rows } = await pool.query(
    `SELECT id, type, amount, comment, person_id, created_at
     FROM expense_entries
     ORDER BY created_at DESC`,
  );
  const entries = rows.map(mapRow);
  return { entries, totals: computeTotals(entries) };
}

export async function createExpense(body: unknown) {
  const data = createSchema.parse(body);
  const { rows } = await pool.query(
    `INSERT INTO expense_entries (type, amount, comment, person_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, type, amount, comment, person_id, created_at`,
    [data.type, data.amount, data.comment, data.personId ?? null],
  );
  return mapRow(rows[0]);
}

export async function createSplitExpense(body: unknown) {
  const data = splitSchema.parse(body);
  const members = data.personIds ?? [...PERSON_IDS];
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
  const result = await pool.query(
    `DELETE FROM expense_entries WHERE id = $1 RETURNING id`,
    [parsed],
  );
  if (result.rowCount === 0) {
    throw new AppError(404, "Entry not found");
  }
}
