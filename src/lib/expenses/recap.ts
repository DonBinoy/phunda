import { PEOPLE } from "@/lib/constants";
import { personName } from "@/lib/rotation";
import type { ExpenseEntry, Person, PersonId } from "@/lib/types";

export type RecapPeriod = "week" | "month";

export function normalizeExpenseLabel(comment: string): string {
  return comment.replace(/\s*\(split equally\)\s*$/i, "").trim();
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getPeriodRange(
  period: RecapPeriod,
  now = new Date(),
): { from: Date; to: Date; label: string } {
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);

  if (period === "week") {
    const from = startOfWeek(now);
    const end = new Date(from);
    end.setDate(end.getDate() + 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    return {
      from,
      to,
      label: `${fmt(from)} – ${fmt(end)}`,
    };
  }

  const from = startOfMonth(now);
  const label = from.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  return { from, to, label };
}

function inPeriod(iso: string, from: Date, to: Date): boolean {
  const t = new Date(iso).getTime();
  return t >= from.getTime() && t <= to.getTime();
}

export interface PersonRecapRow {
  personId: PersonId | null;
  name: string;
  expense: number;
  income: number;
  count: number;
}

export interface ItemRecapRow {
  label: string;
  total: number;
  count: number;
}

export interface ExpenseRecap {
  periodLabel: string;
  totalExpense: number;
  totalIncome: number;
  expenseCount: number;
  byPerson: PersonRecapRow[];
  byItem: ItemRecapRow[];
  topSpender: PersonRecapRow | null;
  topItem: ItemRecapRow | null;
  biggestExpense: ExpenseEntry | null;
}

export function computeExpenseRecap(
  entries: ExpenseEntry[],
  period: RecapPeriod,
  now = new Date(),
  peopleList: Person[] = PEOPLE,
): ExpenseRecap {
  const { from, to, label } = getPeriodRange(period, now);
  const inRange = entries.filter((e) => inPeriod(e.createdAt, from, to));

  let totalExpense = 0;
  let totalIncome = 0;
  let expenseCount = 0;

  const personMap = new Map<
    PersonId | "unassigned",
    { expense: number; income: number; count: number }
  >();
  for (const p of peopleList) {
    personMap.set(p.id, { expense: 0, income: 0, count: 0 });
  }
  personMap.set("unassigned", { expense: 0, income: 0, count: 0 });

  const itemMap = new Map<
    string,
    { label: string; total: number; count: number }
  >();

  let biggestExpense: ExpenseEntry | null = null;

  for (const e of inRange) {
    if (e.type === "expense") {
      totalExpense += e.amount;
      expenseCount += 1;

      const key = e.personId ?? "unassigned";
      let row = personMap.get(key);
      if (!row) {
        row = { expense: 0, income: 0, count: 0 };
        personMap.set(key, row);
      }
      row.expense += e.amount;
      row.count += 1;

      const normalized = normalizeExpenseLabel(e.comment);
      const itemKey = normalized.toLowerCase();
      const item = itemMap.get(itemKey) ?? {
        label: normalized,
        total: 0,
        count: 0,
      };
      item.total += e.amount;
      item.count += 1;
      itemMap.set(itemKey, item);

      if (!biggestExpense || e.amount > biggestExpense.amount) {
        biggestExpense = e;
      }
    } else {
      totalIncome += e.amount;
      if (e.personId) {
        let row = personMap.get(e.personId);
        if (!row) {
          row = { expense: 0, income: 0, count: 0 };
          personMap.set(e.personId, row);
        }
        row.income += e.amount;
        row.count += 1;
      }
    }
  }

  const byPerson: PersonRecapRow[] = peopleList.map((p) => {
    const row = personMap.get(p.id) ?? { expense: 0, income: 0, count: 0 };
    return {
      personId: p.id,
      name: p.name,
      expense: row.expense,
      income: row.income,
      count: row.count,
    };
  });

  const unassigned = personMap.get("unassigned")!;
  if (unassigned && (unassigned.expense > 0 || unassigned.count > 0)) {
    byPerson.push({
      personId: null,
      name: "Unassigned",
      expense: unassigned.expense,
      income: 0,
      count: unassigned.count,
    });
  }

  const byItem: ItemRecapRow[] = [...itemMap.values()]
    .map((v) => ({
      label: v.label,
      total: v.total,
      count: v.count,
    }))
    .sort((a, b) => b.total - a.total);

  const spenders = byPerson.filter((p) => p.expense > 0);
  const topSpender =
    spenders.length > 0
      ? spenders.reduce((a, b) => (b.expense > a.expense ? b : a))
      : null;

  const topItem = byItem.length > 0 ? byItem[0] : null;

  return {
    periodLabel: label,
    totalExpense,
    totalIncome,
    expenseCount,
    byPerson: byPerson.sort((a, b) => b.expense - a.expense),
    byItem,
    topSpender,
    topItem,
    biggestExpense,
  };
}

export function formatRecapPerson(entry: ExpenseEntry): string {
  return entry.personId ? personName(entry.personId) : "Unassigned";
}
