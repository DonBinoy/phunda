"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createCustomTask,
  deleteCustomTask,
  fetchCustomTasks,
  toggleCustomTask,
} from "@/lib/api";
import { toDateKey } from "@/lib/rotation";
import { groupCustomTasksByDate } from "@/lib/tasks";
import type { CustomTask, PersonId } from "@/lib/types";

function rangeAround(center: Date, daysBefore = 30, daysAfter = 30) {
  const from = new Date(center);
  from.setDate(from.getDate() - daysBefore);
  const to = new Date(center);
  to.setDate(to.getDate() + daysAfter);
  return { from: toDateKey(from), to: toDateKey(to) };
}

export function useCustomTasks(centerDate: Date) {
  const [tasks, setTasks] = useState<CustomTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { from, to } = rangeAround(centerDate);
      const data = await fetchCustomTasks(from, to);
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load custom tasks");
    } finally {
      setLoading(false);
    }
  }, [centerDate]);

  useEffect(() => {
    load();
  }, [load]);

  const byDate = useMemo(() => groupCustomTasksByDate(tasks), [tasks]);

  const addTask = async (body: {
    title: string;
    personId: PersonId;
    date: string;
  }) => {
    try {
      const created = await createCustomTask(body);
      setTasks((prev) => [...prev, created]);
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add task";
      setError(message);
      throw err;
    }
  };

  const toggleTask = async (id: string) => {
    const current = tasks.find((t) => t.id === id);
    if (!current) return;

    const next = !current.completed;
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: next } : t)),
    );

    try {
      await toggleCustomTask(id, next);
    } catch (err) {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: current.completed } : t)),
      );
      setError(err instanceof Error ? err.message : "Failed to update task");
    }
  };

  const removeTask = async (id: string) => {
    const removed = tasks.find((t) => t.id === id);
    if (!removed) return;

    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteCustomTask(id);
    } catch (err) {
      setTasks((prev) => [...prev, removed]);
      setError(err instanceof Error ? err.message : "Failed to delete task");
      throw err;
    }
  };

  return {
    tasks,
    byDate,
    loading,
    error,
    addTask,
    toggleTask,
    removeTask,
    reload: load,
  };
}
