import { z } from "zod";
import { pool } from "@/lib/db/pool";
import { AppError } from "@/lib/server/errors";
import { createExpense, createSplitExpense } from "@/lib/services/expenses";

const PERSON_ID_ENUM = ["don", "bijo", "suraj", "adithyan"] as const;

const createTemplateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  amount: z.number().positive(),
  personId: z.enum(PERSON_ID_ENUM).optional(),
  splitEqually: z.boolean().optional(),
});

const applySchema = z.object({
  personId: z.enum(PERSON_ID_ENUM).optional(),
});

function mapTemplateRow(row: {
  id: string;
  name: string;
  amount: string;
  person_id: string | null;
  split_equally: boolean;
  sort_order: number;
  created_at: Date;
}) {
  return {
    id: row.id,
    name: row.name,
    amount: Number(row.amount),
    personId: row.person_id ?? undefined,
    splitEqually: row.split_equally,
    sortOrder: row.sort_order,
    createdAt: row.created_at.toISOString(),
  };
}

export async function getExpenseTemplates() {
  const { rows } = await pool.query(
    `SELECT id, name, amount, person_id, split_equally, sort_order, created_at
     FROM expense_templates
     ORDER BY sort_order ASC, created_at ASC`,
  );
  return rows.map(mapTemplateRow);
}

export async function createExpenseTemplate(body: unknown) {
  const data = createTemplateSchema.parse(body);
  const { rows } = await pool.query(
    `INSERT INTO expense_templates (name, amount, person_id, split_equally)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, amount, person_id, split_equally, sort_order, created_at`,
    [
      data.name,
      data.amount,
      data.personId ?? null,
      data.splitEqually ?? false,
    ],
  );
  return mapTemplateRow(rows[0]);
}

export async function deleteExpenseTemplate(id: string) {
  const parsed = z.string().uuid().parse(id);
  const result = await pool.query(
    `DELETE FROM expense_templates WHERE id = $1 RETURNING id`,
    [parsed],
  );
  if (result.rowCount === 0) {
    throw new AppError(404, "Template not found");
  }
}

export async function applyExpenseTemplate(id: string, body: unknown) {
  const parsedId = z.string().uuid().parse(id);
  const { personId: overridePersonId } = applySchema.parse(body ?? {});

  const { rows } = await pool.query(
    `SELECT id, name, amount, person_id, split_equally, sort_order, created_at
     FROM expense_templates
     WHERE id = $1`,
    [parsedId],
  );

  if (rows.length === 0) {
    throw new AppError(404, "Template not found");
  }

  const template = mapTemplateRow(rows[0]);

  if (template.splitEqually) {
    return createSplitExpense({
      amount: template.amount,
      comment: template.name,
    });
  }

  const personId = overridePersonId ?? template.personId;
  return createExpense({
    type: "expense",
    amount: template.amount,
    comment: template.name,
    personId,
  });
}
