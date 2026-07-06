import { ZodError } from "zod";
export class AppError extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}
export function errorHandler(err, _req, res, _next) {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
    }
    if (err instanceof ZodError) {
        res.status(400).json({ error: err.flatten().fieldErrors });
        return;
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
}
