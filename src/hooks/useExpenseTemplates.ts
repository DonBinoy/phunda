"use client";

import { useCallback, useEffect, useState } from "react";
import {
  applyExpenseTemplate,
  createExpenseTemplate,
  deleteExpenseTemplate,
  fetchExpenseTemplates,
} from "@/lib/api";
import type { ExpenseEntry, ExpenseTemplate, PersonId } from "@/lib/types";

export function useExpenseTemplates() {
  const [templates, setTemplates] = useState<ExpenseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setTemplates(await fetchExpenseTemplates());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load expense templates",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addTemplate = async (body: {
    name: string;
    amount: number;
    personId?: PersonId;
    splitEqually?: boolean;
  }) => {
    const created = await createExpenseTemplate(body);
    setTemplates((prev) => [...prev, created]);
    return created;
  };

  const removeTemplate = async (id: string) => {
    const prev = templates;
    setTemplates((t) => t.filter((x) => x.id !== id));
    try {
      await deleteExpenseTemplate(id);
    } catch (err) {
      setTemplates(prev);
      throw err;
    }
  };

  const applyTemplate = async (
    id: string,
    personId?: PersonId,
  ): Promise<ExpenseEntry | ExpenseEntry[]> => {
    return applyExpenseTemplate(id, personId ? { personId } : undefined);
  };

  return {
    templates,
    loading,
    error,
    addTemplate,
    removeTemplate,
    applyTemplate,
    reload: load,
  };
}
