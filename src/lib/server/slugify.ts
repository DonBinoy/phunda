export function slugify(value: string, maxLen = 30): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, maxLen);
  return slug || "item";
}

export async function uniqueSlug(
  base: string,
  exists: (id: string) => Promise<boolean>,
  maxLen = 30,
): Promise<string> {
  const root = slugify(base, maxLen);
  if (!(await exists(root))) return root;

  for (let i = 2; i < 100; i++) {
    const suffix = `_${i}`;
    const candidate = `${root.slice(0, maxLen - suffix.length)}${suffix}`;
    if (!(await exists(candidate))) return candidate;
  }

  return `${root.slice(0, maxLen - 9)}_${Date.now()}`;
}
