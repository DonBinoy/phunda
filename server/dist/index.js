import express from "express";
import dotenv from "dotenv";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./db/pool.js";
import { corsMiddleware } from "./middleware/cors.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { completionsRouter } from "./routes/completions.js";
import { customTasksRouter } from "./routes/customTasks.js";
import { expensesRouter } from "./routes/expenses.js";
import { todosRouter } from "./routes/todos.js";
dotenv.config();
const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4000;
async function runMigrations() {
    const schema = readFileSync(join(__dirname, "db", "schema.sql"), "utf-8");
    await pool.query(schema);
}
async function start() {
    await runMigrations();
    const app = express();
    app.use(corsMiddleware);
    app.options("*", corsMiddleware);
    app.use(express.json());
    app.get("/api/health", async (_req, res) => {
        await pool.query("SELECT 1");
        res.json({ status: "ok", service: "phunda-api" });
    });
    app.use("/api/completions", completionsRouter);
    app.use("/api/custom-tasks", customTasksRouter);
    app.use("/api/todos", todosRouter);
    app.use("/api/expenses", expensesRouter);
    app.use(errorHandler);
    app.listen(PORT, () => {
        console.log(`PHUNDA API running on http://localhost:${PORT}`);
    });
}
start().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});
