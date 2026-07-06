import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ensureDb } from "@/lib/db/ensure";
import { getDatabaseUrl } from "@/lib/db/pool";
import { AppError } from "./errors";

export function handleError(err: unknown) {
  if (err instanceof AppError) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode });
  }
  if (err instanceof ZodError) {
    return NextResponse.json({ error: err.flatten().fieldErrors }, { status: 400 });
  }

  const message = err instanceof Error ? err.message : "Unknown error";
  console.error("API error:", err);

  if (!getDatabaseUrl()) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured on the server" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      error: "Internal server error",
      detail: process.env.NODE_ENV === "development" ? message : undefined,
    },
    { status: 500 },
  );
}

export async function withDb<T>(fn: () => Promise<T>): Promise<T> {
  if (!getDatabaseUrl()) {
    throw new AppError(500, "DATABASE_URL is not configured");
  }
  await ensureDb();
  return fn();
}

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}
