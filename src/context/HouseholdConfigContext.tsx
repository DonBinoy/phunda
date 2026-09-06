"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createChore,
  createPerson,
  fetchChores,
  fetchPeople,
} from "@/lib/api";
import {
  buildHouseholdConfig,
  DEFAULT_HOUSEHOLD_CONFIG,
  type HouseholdConfig,
} from "@/lib/householdConfig";
import type { DailyTask, Person, WeekendTask } from "@/lib/types";

interface HouseholdConfigContextValue {
  config: HouseholdConfig;
  people: Person[];
  dailyTasks: DailyTask[];
  weekendTasks: WeekendTask[];
  personIds: string[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  addPerson: (name: string) => Promise<Person>;
  addChore: (body: {
    name: string;
    shortName?: string;
    category: "daily" | "weekend";
    slots?: number;
  }) => Promise<void>;
}

const HouseholdConfigContext =
  createContext<HouseholdConfigContextValue | null>(null);

export function HouseholdConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<HouseholdConfig>(DEFAULT_HOUSEHOLD_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const [people, chores] = await Promise.all([fetchPeople(), fetchChores()]);
      if (people.length > 0 && chores.length > 0) {
        setConfig(buildHouseholdConfig(people, chores));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load household config",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addPerson = useCallback(
    async (name: string) => {
      const created = await createPerson({ name });
      await reload();
      return { id: created.id, name: created.name };
    },
    [reload],
  );

  const addChore = useCallback(
    async (body: {
      name: string;
      shortName?: string;
      category: "daily" | "weekend";
      slots?: number;
    }) => {
      await createChore(body);
      await reload();
    },
    [reload],
  );

  const value = useMemo<HouseholdConfigContextValue>(
    () => ({
      config,
      people: config.people,
      dailyTasks: config.dailyTasks,
      weekendTasks: config.weekendTasks,
      personIds: config.personIds,
      loading,
      error,
      reload,
      addPerson,
      addChore,
    }),
    [config, loading, error, reload, addPerson, addChore],
  );

  return (
    <HouseholdConfigContext.Provider value={value}>
      {children}
    </HouseholdConfigContext.Provider>
  );
}

export function useHouseholdConfig() {
  const ctx = useContext(HouseholdConfigContext);
  if (!ctx) {
    throw new Error(
      "useHouseholdConfig must be used within HouseholdConfigProvider",
    );
  }
  return ctx;
}
