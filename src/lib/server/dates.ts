/** Format a PostgreSQL DATE value without UTC timezone shift */
export function formatPgDate(value: Date | string): string {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
