import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { AppError } from "../middleware/errorHandler.js";
import { formatPgDate } from "../lib/dates.js";
const PERSON_IDS = ["don", "bijo", "suraj", "adithyan"];
const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const createSchema = z.object({
    title: z.string().trim().min(1).max(200),
    personId: z.enum(PERSON_IDS),
    date: dateKeySchema,
});
export const customTasksRouter = Router();
function mapRow(row) {
    return {
        id: row.id,
        title: row.title,
        personId: row.person_id,
        date: formatPgDate(row.task_date),
        completed: row.completed,
        createdAt: row.created_at.toISOString(),
    };
}
customTasksRouter.get("/", async (req, res, next) => {
    try {
        const from = z.string().optional().parse(req.query.from);
        const to = z.string().optional().parse(req.query.to);
        let query = `
      SELECT id, title, person_id, task_date, completed, created_at
      FROM custom_tasks
    `;
        const params = [];
        if (from && to) {
            query += ` WHERE task_date BETWEEN $1::date AND $2::date`;
            params.push(from, to);
        }
        else if (from) {
            query += ` WHERE task_date >= $1::date`;
            params.push(from);
        }
        else if (to) {
            query += ` WHERE task_date <= $1::date`;
            params.push(to);
        }
        query += ` ORDER BY task_date, created_at`;
        const { rows } = await pool.query(query, params);
        res.json(rows.map(mapRow));
    }
    catch (err) {
        next(err);
    }
});
customTasksRouter.post("/", async (req, res, next) => {
    try {
        const body = createSchema.parse(req.body);
        const { rows } = await pool.query(`INSERT INTO custom_tasks (title, person_id, task_date)
       VALUES ($1, $2, $3::date)
       RETURNING id, title, person_id, task_date, completed, created_at`, [body.title, body.personId, body.date]);
        res.status(201).json(mapRow(rows[0]));
    }
    catch (err) {
        next(err);
    }
});
customTasksRouter.put("/:id/toggle", async (req, res, next) => {
    try {
        const id = z.string().uuid().parse(req.params.id);
        const completed = z.boolean().optional().parse(req.body?.completed);
        const existing = await pool.query(`SELECT completed FROM custom_tasks WHERE id = $1`, [id]);
        if (existing.rowCount === 0) {
            throw new AppError(404, "Task not found");
        }
        const nextCompleted = completed !== undefined ? completed : !existing.rows[0].completed;
        const { rows } = await pool.query(`UPDATE custom_tasks SET completed = $2
       WHERE id = $1
       RETURNING id, title, person_id, task_date, completed, created_at`, [id, nextCompleted]);
        res.json(mapRow(rows[0]));
    }
    catch (err) {
        next(err);
    }
});
customTasksRouter.delete("/:id", async (req, res, next) => {
    try {
        const id = z.string().uuid().parse(req.params.id);
        const result = await pool.query(`DELETE FROM custom_tasks WHERE id = $1 RETURNING id`, [id]);
        if (result.rowCount === 0) {
            throw new AppError(404, "Task not found");
        }
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
