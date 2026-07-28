"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchCompletions,
  fetchCustomTasks,
  fetchOutsideEatingDays,
  fetchTodos,
} from "@/lib/api";
import { getPerformanceRange } from "@/lib/performance";
import type { CompletionsStore, CustomTask, TodoList } from "@/lib/types";

/** Loads full history from rotation epoch — for performance, podium & achievements. */
export function useHouseholdStats() {
  const [completions, setCompletions] = useState<CompletionsStore>({});
  const [customTasks, setCustomTasks] = useState<CustomTask[]>([]);
  const [todos, setTodos] = useState<TodoList[]>([]);
  const [outsideEatingDays, setOutsideEatingDays] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { from, to } = getPerformanceRange("all");
      const [comp, custom, todoLists, outside] = await Promise.all([
        fetchCompletions(from, to),
        fetchCustomTasks(from, to),
        fetchTodos(from, to),
        fetchOutsideEatingDays(),
      ]);
      setCompletions(comp);
      setCustomTasks(custom);
      setTodos(todoLists);
      setOutsideEatingDays(new Set(outside));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load household stats",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    completions,
    customTasks,
    todos,
    outsideEatingDays,
    loading,
    error,
    reload: load,
  };
}
