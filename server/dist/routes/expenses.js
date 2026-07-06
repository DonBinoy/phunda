import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { AppError } from "../middleware/errorHandler.js";
const PERSON_IDS = ["don", "bijo", "suraj", "adithyan"];
const createSchema = z
    .object({
    type: z.enum(["expense", "income"]),
    amount: z.number().positive(),
    comment: z.string().trim().min(1).max(500),
    personId: z.enum(PERSON_IDS).optional(),
})
    .refine((data) => data.type !== "income" || !!data.personId, {
    message: "personId is required for income entries",
    path: ["personId"],
});
export const expensesRouter = Router();
function mapRow(row) {
    return {
        id: row.id,
        type: row.type,
        amount: Number(row.amount),
        comment: row.comment,
        personId: row.person_id ?? undefined,
        createdAt: row.created_at.toISOString(),
    };
}
function computeTotals(entries) {
    let expense = 0;
    let income = 0;
    const byPerson = {};
    for (const id of PERSON_IDS) {
        byPerson[id] = { income: 0, expense: 0, balance: 0 };
    }
    for (const e of entries) {
        if (e.type === "expense")
            expense += e.amount;
        else
            income += e.amount;
        if (e.personId && byPerson[e.personId]) {
            if (e.type === "expense")
                byPerson[e.personId].expense += e.amount;
            else
                byPerson[e.personId].income += e.amount;
        }
    }
    for (const id of PERSON_IDS) {
        byPerson[id].balance = byPerson[id].income - byPerson[id].expense;
    }
    return { expense, income, balance: income - expense, byPerson };
}
expensesRouter.get("/", async (_req, res, next) => {
    try {
        const { rows } = await pool.query(`SELECT id, type, amount, comment, person_id, created_at
       FROM expense_entries
       ORDER BY created_at DESC`);
        const entries = rows.map(mapRow);
        const totals = computeTotals(entries);
        res.json({ entries, totals });
    }
    catch (err) {
        next(err);
    }
});
expensesRouter.post("/", async (req, res, next) => {
    try {
        const body = createSchema.parse(req.body);
        const { rows } = await pool.query(`INSERT INTO expense_entries (type, amount, comment, person_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, type, amount, comment, person_id, created_at`, [body.type, body.amount, body.comment, body.personId ?? null]);
        res.status(201).json(mapRow(rows[0]));
    }
    catch (err) {
        next(err);
    }
});
expensesRouter.delete("/:id", async (req, res, next) => {
    try {
        const id = z.string().uuid().parse(req.params.id);
        const result = await pool.query(`DELETE FROM expense_entries WHERE id = $1 RETURNING id`, [id]);
        if (result.rowCount === 0) {
            throw new AppError(404, "Entry not found");
        }
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
