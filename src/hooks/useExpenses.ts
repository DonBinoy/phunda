"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createExpense,
  createSplitExpense,
  deleteExpense,
  fetchExpenses,
  type ExpensesResponse,
} from "@/lib/api";
import { PEOPLE } from "@/lib/constants";
import type { ExpenseEntry, PersonId, PersonTotalsMap } from "@/lib/types";

function buildEmptyByPerson(personIds?: readonly string[]): PersonTotalsMap {
  const ids = personIds && personIds.length > 0 ? personIds : PEOPLE.map((p) => p.id);
  return Object.fromEntries(
    ids.map((id) => [id, { income: 0, expense: 0, balance: 0 }]),
  ) as PersonTotalsMap;
}

function recomputeTotals(
  entries: ExpenseEntry[],
  personIds?: readonly string[],
): ExpensesResponse["totals"] {
  let expense = 0;
  let income = 0;
  const byPerson = buildEmptyByPerson(personIds);

  for (const e of entries) {
    if (e.type === "expense") expense += e.amount;
    else income += e.amount;

    if (e.personId) {
      if (!byPerson[e.personId]) {
        byPerson[e.personId] = { income: 0, expense: 0, balance: 0 };
      }
      if (e.type === "expense") byPerson[e.personId].expense += e.amount;
      else byPerson[e.personId].income += e.amount;
    }
  }

  for (const id of Object.keys(byPerson)) {
    byPerson[id].balance =
      byPerson[id].income - byPerson[id].expense;
  }

  return { expense, income, balance: income - expense, byPerson };
}

export function useExpenses(personIds?: readonly string[]) {
  const [entries, setEntries] = useState<ExpenseEntry[]>([]);
  const [totals, setTotals] = useState<ExpensesResponse["totals"]>(() => ({
    expense: 0,
    income: 0,
    balance: 0,
    byPerson: buildEmptyByPerson(personIds),
  }));
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
      setTotals(recomputeTotals(next, personIds));
      return next;
    });
  };

  const addSplitExpense = async (body: {
    amount: number;
    comment: string;
    personIds?: PersonId[];
  }) => {
    const created = await createSplitExpense(body);
    setEntries((prev) => {
      const next = [...created, ...prev];
      setTotals(recomputeTotals(next, personIds));
      return next;
    });
    return created;
  };

  const mergeCreated = (created: ExpenseEntry | ExpenseEntry[]) => {
    const batch = Array.isArray(created) ? created : [created];
    setEntries((prev) => {
      const next = [...batch, ...prev];
      setTotals(recomputeTotals(next, personIds));
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
    setTotals(recomputeTotals(nextEntries, personIds));

    try {
      await deleteExpense(id);
    } catch (err) {
      setEntries(prevEntries);
      setTotals(prevTotals);
      throw err;
    }
  };

  return {
    entries,
    totals,
    loading,
    error,
    addEntry,
    addSplitExpense,
    mergeCreated,
    removeEntry,
    reload: load,
  };
}
