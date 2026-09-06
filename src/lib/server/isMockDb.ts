import { getDatabaseUrl } from "@/lib/db/pool";

export function isMockDb(): boolean {
  if (process.env.MOCK_DB === "true" || process.env.NEXT_PUBLIC_MOCK_DB === "true") {
    return true;
  }
  return !getDatabaseUrl();
}
