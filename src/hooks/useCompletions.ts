"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchCompletions, toggleCompletion } from "@/lib/api";
import { toDateKey } from "@/lib/rotation";
import type { CompletionsStore, DailyTaskId, WeekendTaskId } from "@/lib/types";

function rangeAround(center: Date, daysBefore = 30, daysAfter = 30) {
  const from = new Date(center);
  from.setDate(from.getDate() - daysBefore);
  const to = new Date(center);
  to.setDate(to.getDate() + daysAfter);
  return { from: toDateKey(from), to: toDateKey(to) };
}

export function useCompletions(centerDate: Date) {
  const [completions, setCompletions] = useState<CompletionsStore>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { from, to } = rangeAround(centerDate);
      const data = await fetchCompletions(from, to);
      setCompletions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [centerDate]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleDaily = async (dateKey: string, taskId: DailyTaskId) => {
    const current = completions[dateKey]?.daily?.[taskId] ?? false;
    const next = !current;

    setCompletions((prev) => {
      const day = prev[dateKey] ?? { daily: {}, weekend: {} };
      return {
        ...prev,
        [dateKey]: {
          ...day,
          daily: { ...day.daily, [taskId]: next },
        },
      };
    });

    try {
      await toggleCompletion({ date: dateKey, category: "daily", taskId, completed: next });
    } catch (err) {
      setCompletions((prev) => {
        const day = prev[dateKey] ?? { daily: {}, weekend: {} };
        return {
          ...prev,
          [dateKey]: {
            ...day,
            daily: { ...day.daily, [taskId]: current },
          },
        };
      });
      setError(err instanceof Error ? err.message : "Failed to update task");
    }
  };

  const toggleWeekend = async (dateKey: string, taskId: WeekendTaskId) => {
    const current = completions[dateKey]?.weekend?.[taskId] ?? false;
    const next = !current;

    setCompletions((prev) => {
      const day = prev[dateKey] ?? { daily: {}, weekend: {} };
      return {
        ...prev,
        [dateKey]: {
          ...day,
          weekend: { ...day.weekend, [taskId]: next },
        },
      };
    });

    try {
      await toggleCompletion({ date: dateKey, category: "weekend", taskId, completed: next });
    } catch (err) {
      setCompletions((prev) => {
        const day = prev[dateKey] ?? { daily: {}, weekend: {} };
        return {
          ...prev,
          [dateKey]: {
            ...day,
            weekend: { ...day.weekend, [taskId]: current },
          },
        };
      });
      setError(err instanceof Error ? err.message : "Failed to update task");
    }
  };

  return { completions, loading, error, toggleDaily, toggleWeekend, reload: load };
}
