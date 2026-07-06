import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ensureDb } from "@/lib/db/ensure";
import { AppError } from "./errors";

export function handleError(err: unknown) {
  if (err instanceof AppError) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode });
  }
  if (err instanceof ZodError) {
    return NextResponse.json({ error: err.flatten().fieldErrors }, { status: 400 });
  }
  console.error(err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function withDb<T>(fn: () => Promise<T>): Promise<T> {
  await ensureDb();
  return fn();
}

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}
