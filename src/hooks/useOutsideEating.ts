"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchOutsideEatingDays, toggleOutsideEating } from "@/lib/api";

/** Loads every marked day so admin calendar + rotation offsets stay accurate. */
export function useOutsideEating(_centerDate?: Date) {
  const [dates, setDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchOutsideEatingDays();
      setDates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load outside eating days");
    } finally {
      setLoading(false);
    }
  }, []);

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
