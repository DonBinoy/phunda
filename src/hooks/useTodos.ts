"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createTodo,
  deleteTodo,
  fetchTodos,
  toggleTodoItem,
} from "@/lib/api";
import { toDateKey } from "@/lib/rotation";
import { groupTodosByDate } from "@/lib/tasks";
import type { PersonId, TodoList } from "@/lib/types";

function rangeAround(center: Date, daysBefore = 30, daysAfter = 30) {
  const from = new Date(center);
  from.setDate(from.getDate() - daysBefore);
  const to = new Date(center);
  to.setDate(to.getDate() + daysAfter);
  return { from: toDateKey(from), to: toDateKey(to) };
}

export function useTodos(centerDate: Date) {
  const [todos, setTodos] = useState<TodoList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { from, to } = rangeAround(centerDate);
      const data = await fetchTodos(from, to);
      setTodos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load todos");
    } finally {
      setLoading(false);
    }
  }, [centerDate]);

  useEffect(() => {
    load();
  }, [load]);

  const byDate = useMemo(() => groupTodosByDate(todos), [todos]);

  const addTodo = async (body: {
    title: string;
    personId: PersonId;
    date: string;
    items: string[];
  }) => {
    const created = await createTodo(body);
    setTodos((prev) => [...prev, created]);
    return created;
  };

  const toggleItem = async (listId: string, itemId: string) => {
    const list = todos.find((t) => t.id === listId);
    const item = list?.items.find((i) => i.id === itemId);
    if (!item) return;

    const next = !item.completed;
    setTodos((prev) =>
      prev.map((t) =>
        t.id === listId
          ? {
              ...t,
              items: t.items.map((i) =>
                i.id === itemId ? { ...i, completed: next } : i,
              ),
            }
          : t,
      ),
    );

    try {
      await toggleTodoItem(itemId, next);
    } catch (err) {
      setTodos((prev) =>
        prev.map((t) =>
          t.id === listId
            ? {
                ...t,
                items: t.items.map((i) =>
                  i.id === itemId ? { ...i, completed: item.completed } : i,
                ),
              }
            : t,
        ),
      );
      setError(err instanceof Error ? err.message : "Failed to update item");
    }
  };

  const removeTodo = async (id: string) => {
    const removed = todos.find((t) => t.id === id);
    if (!removed) return;

    setTodos((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteTodo(id);
    } catch (err) {
      setTodos((prev) => [...prev, removed]);
      setError(err instanceof Error ? err.message : "Failed to delete todo");
      throw err;
    }
  };

  return {
    todos,
    byDate,
    loading,
    error,
    addTodo,
    toggleItem,
    removeTodo,
    reload: load,
  };
}
