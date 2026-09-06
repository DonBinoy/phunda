import { z } from "zod";
import { getPersonIds } from "@/lib/services/people";
import { AppError } from "@/lib/server/errors";

export async function parsePersonId(value: unknown): Promise<string> {
  const id = z.string().trim().min(1).max(30).parse(value);
  const ids = await getPersonIds();
  if (!ids.includes(id)) {
    throw new AppError(400, `Unknown person: ${id}`);
  }
  return id;
}

export async function parseOptionalPersonId(
  value: unknown,
): Promise<string | undefined> {
  if (value === undefined || value === null || value === "") return undefined;
  return parsePersonId(value);
}

export async function parsePersonIdList(
  value: unknown,
  min = 1,
): Promise<string[]> {
  const ids = z.array(z.string().trim().min(1).max(30)).min(min).parse(value);
  const valid = await getPersonIds();
  for (const id of ids) {
    if (!valid.includes(id)) {
      throw new AppError(400, `Unknown person: ${id}`);
    }
  }
  return ids;
}
