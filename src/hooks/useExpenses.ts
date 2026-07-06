"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createExpense,
  deleteExpense,
  fetchExpenses,
  type ExpensesResponse,
} from "@/lib/api";
import { PEOPLE } from "@/lib/constants";
import type { ExpenseEntry, PersonId, PersonTotalsMap } from "@/lib/types";

const EMPTY_BY_PERSON = Object.fromEntries(
  PEOPLE.map((p) => [p.id, { income: 0, expense: 0, balance: 0 }]),
) as PersonTotalsMap;

function recomputeTotals(entries: ExpenseEntry[]): ExpensesResponse["totals"] {
  let expense = 0;
  let income = 0;
  const byPerson = structuredClone(EMPTY_BY_PERSON);

  for (const e of entries) {
    if (e.type === "expense") expense += e.amount;
    else income += e.amount;

    if (e.personId) {
      if (e.type === "expense") byPerson[e.personId].expense += e.amount;
      else byPerson[e.personId].income += e.amount;
    }
  }

  for (const p of PEOPLE) {
    byPerson[p.id].balance =
      byPerson[p.id].income - byPerson[p.id].expense;
  }

  return { expense, income, balance: income - expense, byPerson };
}

export function useExpenses() {
  const [entries, setEntries] = useState<ExpenseEntry[]>([]);
  const [totals, setTotals] = useState<ExpensesResponse["totals"]>({
    expense: 0,
    income: 0,
    balance: 0,
    byPerson: EMPTY_BY_PERSON,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchExpenses();
      setEntries(data.entries);
      setTotals(data.totals);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addEntry = async (body: {
    type: "expense" | "income";
    amount: number;
    comment: string;
    personId?: PersonId;
  }) => {
    const created = await createExpense(body);
    setEntries((prev) => {
      const next = [created, ...prev];
      setTotals(recomputeTotals(next));
      return next;
    });
  };

  const removeEntry = async (id: string) => {
    const removed = entries.find((e) => e.id === id);
    if (!removed) return;

    const prevEntries = entries;
    const prevTotals = totals;
    const nextEntries = entries.filter((e) => e.id !== id);
    setEntries(nextEntries);
    setTotals(recomputeTotals(nextEntries));

    try {
      await deleteExpense(id);
    } catch (err) {
      setEntries(prevEntries);
      setTotals(prevTotals);
      throw err;
    }
  };

  return { entries, totals, loading, error, addEntry, removeEntry, reload: load };
}
