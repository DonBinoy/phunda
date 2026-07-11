import type { PersonId } from "@/lib/types";

/** Split a whole-rupee total into equal shares; remainder rupees go to first people. */
export function splitAmountEqually(total: number, count: number): number[] {
  if (count < 1) throw new Error("count must be at least 1");
  const amount = Math.round(total);
  if (amount <= 0) throw new Error("total must be positive");

  const base = Math.floor(amount / count);
  const remainder = amount - base * count;

  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}

export function buildSplitShares(
  total: number,
  personIds: readonly PersonId[],
): { personId: PersonId; amount: number }[] {
  const amounts = splitAmountEqually(total, personIds.length);
  return personIds.map((personId, i) => ({
    personId,
    amount: amounts[i],
  }));
}
