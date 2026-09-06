import {
  BASELINE_PERSON_TASKS,
  DAILY_TASKS,
  KITCHEN_PAIR_A,
  KITCHEN_PAIR_B,
  PEOPLE,
  TASK_ROTATION,
  WEEKEND_KITCHEN_OFFSET,
  WEEKEND_TASKS,
} from "./constants";
import type { DailyTask, Person, WeekendTask } from "./types";

export interface HouseholdConfig {
  people: Person[];
  dailyTasks: DailyTask[];
  weekendTasks: WeekendTask[];
  personIds: string[];
  baselinePersonTasks: Record<string, number>;
  taskRotation: number[];
  kitchenPairA: string[];
  kitchenPairB: string[];
  weekendKitchenOffset: number;
}

export interface HouseholdApiPerson {
  id: string;
  name: string;
  baselineTaskIndex: number;
  sortOrder: number;
}

export interface HouseholdApiChore {
  id: string;
  name: string;
  shortName: string;
  category: "daily" | "weekend";
  slots: number;
  sortOrder: number;
}

function buildTaskRotation(taskCount: number): number[] {
  if (taskCount === 4) return [...TASK_ROTATION];
  return Array.from({ length: taskCount }, (_, i) => (i + 1) % taskCount);
}

function splitKitchenPairs(personIds: string[]): [string[], string[]] {
  if (personIds.length === 0) return [[], []];
  const mid = Math.ceil(personIds.length / 2);
  return [personIds.slice(0, mid), personIds.slice(mid)];
}

export function buildHouseholdConfig(
  apiPeople: HouseholdApiPerson[],
  apiChores: HouseholdApiChore[],
): HouseholdConfig {
  const people: Person[] = apiPeople.map((p) => ({ id: p.id, name: p.name }));
  const personIds = people.map((p) => p.id);

  const dailyTasks: DailyTask[] = apiChores
    .filter((c) => c.category === "daily")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => ({
      id: c.id,
      name: c.name,
      shortName: c.shortName,
    }));

  const weekendTasks: WeekendTask[] = apiChores
    .filter((c) => c.category === "weekend")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => ({
      id: c.id,
      name: c.name,
      slots: c.slots,
    }));

  const baselinePersonTasks: Record<string, number> = {};
  for (const person of apiPeople) {
    baselinePersonTasks[person.id] = person.baselineTaskIndex;
  }

  const taskCount = Math.max(dailyTasks.length, 1);
  const [kitchenPairA, kitchenPairB] = splitKitchenPairs(personIds);

  return {
    people,
    dailyTasks,
    weekendTasks,
    personIds,
    baselinePersonTasks,
    taskRotation: buildTaskRotation(taskCount),
    kitchenPairA,
    kitchenPairB,
    weekendKitchenOffset: WEEKEND_KITCHEN_OFFSET,
  };
}

export const DEFAULT_HOUSEHOLD_CONFIG: HouseholdConfig = buildHouseholdConfig(
  PEOPLE.map((p, i) => ({
    id: p.id,
    name: p.name,
    baselineTaskIndex: BASELINE_PERSON_TASKS[p.id] ?? i % DAILY_TASKS.length,
    sortOrder: i,
  })),
  [
    ...DAILY_TASKS.map((t, i) => ({
      id: t.id,
      name: t.name,
      shortName: t.shortName,
      category: "daily" as const,
      slots: 1,
      sortOrder: i,
    })),
    ...WEEKEND_TASKS.map((t, i) => ({
      id: t.id,
      name: t.name,
      shortName: t.name,
      category: "weekend" as const,
      slots: t.slots,
      sortOrder: i,
    })),
  ],
);

// Preserve original kitchen pairs when using default 4-person setup
DEFAULT_HOUSEHOLD_CONFIG.kitchenPairA = [...KITCHEN_PAIR_A];
DEFAULT_HOUSEHOLD_CONFIG.kitchenPairB = [...KITCHEN_PAIR_B];
