"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchOutsideEatingDays, toggleOutsideEating } from "@/lib/api";
import { toDateKey } from "@/lib/rotation";

function rangeAround(center: Date, daysBefore = 30, daysAfter = 30) {
  const from = new Date(center);
  from.setDate(from.getDate() - daysBefore);
  const to = new Date(center);
  to.setDate(to.getDate() + daysAfter);
  return { from: toDateKey(from), to: toDateKey(to) };
}

export function useOutsideEating(centerDate: Date) {
  const [dates, setDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { from, to } = rangeAround(centerDate);
      const data = await fetchOutsideEatingDays(from, to);
      setDates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load outside eating days");
    } finally {
      setLoading(false);
    }
  }, [centerDate]);

  useEffect(() => {
    load();
  }, [load]);

  const outsideEatingDays = useMemo(() => new Set(dates), [dates]);

  const toggleDay = async (dateKey: string) => {
    const current = outsideEatingDays.has(dateKey);
    const next = !current;

    setDates((prev) =>
      next ? [...prev, dateKey].sort() : prev.filter((d) => d !== dateKey),
    );

    try {
      await toggleOutsideEating({ date: dateKey, active: next });
    } catch (err) {
      setDates((prev) =>
        current
          ? [...prev, dateKey].sort()
          : prev.filter((d) => d !== dateKey),
      );
      setError(err instanceof Error ? err.message : "Failed to update outside eating");
    }
  };

  return { outsideEatingDays, loading, error, toggleDay, reload: load };
}
