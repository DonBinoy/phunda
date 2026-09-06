import {
  BASELINE_PERSON_TASKS,
  DAILY_TASKS,
  KITCHEN_PAIR_A,
  KITCHEN_PAIR_B,
  PEOPLE,
  ROTATION_EPOCH,
  TASK_ROTATION,
  WEEKEND_KITCHEN_OFFSET,
  WEEKEND_TASKS,
} from "./constants";
import {
  DEFAULT_HOUSEHOLD_CONFIG,
  type HouseholdConfig,
} from "./householdConfig";
import type {
  DailyAssignment,
  DailyTaskId,
  PersonId,
  WeekendAssignment,
  WeekendTaskId,
} from "./types";

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function daysSinceEpoch(date: Date): number {
  const epoch = parseDateKey(ROTATION_EPOCH);
  const utcDate = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const utcEpoch = Date.UTC(
    epoch.getFullYear(),
    epoch.getMonth(),
    epoch.getDate(),
  );
  return Math.round((utcDate - utcEpoch) / 86_400_000);
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function isOutsideEatingDay(
  date: Date,
  outsideEatingDays: ReadonlySet<string>,
): boolean {
  return outsideEatingDays.has(toDateKey(date));
}

export function countOutsideEatingDaysBefore(
  date: Date,
  outsideEatingDays: ReadonlySet<string>,
): number {
  if (outsideEatingDays.size === 0) return 0;

  let count = 0;
  const epoch = parseDateKey(ROTATION_EPOCH);
  const current = new Date(epoch);
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  while (current < target) {
    if (outsideEatingDays.has(toDateKey(current))) count++;
    current.setDate(current.getDate() + 1);
  }

  return count;
}

export function getDailyAssignmentOffset(
  date: Date,
  outsideEatingDays: ReadonlySet<string>,
): number {
  return daysSinceEpoch(date) - countOutsideEatingDaysBefore(date, outsideEatingDays);
}

export function hasRescheduledDailyChores(
  date: Date,
  outsideEatingDays: ReadonlySet<string>,
): boolean {
  if (isOutsideEatingDay(date, outsideEatingDays)) return false;
  return countOutsideEatingDaysBefore(date, outsideEatingDays) > 0;
}

export function totalTasksForDate(
  date: Date,
  outsideEatingDays: ReadonlySet<string> = new Set(),
  config: HouseholdConfig = DEFAULT_HOUSEHOLD_CONFIG,
): number {
  const daily = isOutsideEatingDay(date, outsideEatingDays)
    ? 0
    : config.dailyTasks.length;
  return daily + (isWeekend(date) ? config.weekendTasks.length : 0);
}

export function completionCountForDate(
  date: Date,
  dayComp?: { daily?: Record<string, boolean>; weekend?: Record<string, boolean> },
): number {
  const daily = Object.values(dayComp?.daily ?? {}).filter(Boolean).length;
  const weekend = isWeekend(date)
    ? Object.values(dayComp?.weekend ?? {}).filter(Boolean).length
    : 0;
  return daily + weekend;
}

function taskIndexForPerson(
  personId: PersonId,
  dayOffset: number,
  config: HouseholdConfig,
): number {
  const taskCount = Math.max(config.dailyTasks.length, 1);
  let idx = config.baselinePersonTasks[personId] ?? 0;
  const cycle = config.taskRotation.length || taskCount;
  const steps = ((dayOffset % cycle) + cycle) % cycle;
  for (let i = 0; i < steps; i++) {
    idx = config.taskRotation[idx] ?? (idx + 1) % taskCount;
  }
  return idx % taskCount;
}

function buildDailyAssignments(
  dayOffset: number,
  config: HouseholdConfig,
): DailyAssignment[] {
  const indexTask = config.dailyTasks.map((t) => t.id);
  const byTask = new Map<DailyTaskId, PersonId>();

  for (const personId of config.personIds) {
    const taskIdx = taskIndexForPerson(personId, dayOffset, config);
    byTask.set(indexTask[taskIdx], personId);
  }

  return config.dailyTasks.map((task) => ({
    taskId: task.id,
    personId: byTask.get(task.id) ?? config.personIds[0] ?? "",
  }));
}

export function getDailyAssignments(
  date: Date,
  outsideEatingDays: ReadonlySet<string> = new Set(),
  config: HouseholdConfig = DEFAULT_HOUSEHOLD_CONFIG,
): DailyAssignment[] {
  if (isOutsideEatingDay(date, outsideEatingDays)) return [];
  if (config.dailyTasks.length === 0 || config.personIds.length === 0) return [];
  const offset = getDailyAssignmentOffset(date, outsideEatingDays);
  return buildDailyAssignments(offset, config);
}

export function getPersonDailyTask(
  personId: PersonId,
  date: Date,
  outsideEatingDays: ReadonlySet<string> = new Set(),
  config: HouseholdConfig = DEFAULT_HOUSEHOLD_CONFIG,
): DailyTaskId | null {
  if (isOutsideEatingDay(date, outsideEatingDays)) return null;
  if (config.dailyTasks.length === 0) return null;
  const offset = getDailyAssignmentOffset(date, outsideEatingDays);
  const taskIdx = taskIndexForPerson(personId, offset, config);
  return config.dailyTasks[taskIdx]?.id ?? null;
}

export function getWeekendAssignments(
  date: Date,
  config: HouseholdConfig = DEFAULT_HOUSEHOLD_CONFIG,
): WeekendAssignment[] {
  if (config.weekendTasks.length === 0 || config.personIds.length === 0) {
    return [];
  }

  const saturdays = countSaturdaysSinceEpoch(date);
  const weekIndex =
    (((saturdays + config.weekendKitchenOffset) % 2) + 2) % 2;
  const kitchenPair =
    weekIndex === 0 ? config.kitchenPairA : config.kitchenPairB;
  const otherPair =
    weekIndex === 0 ? config.kitchenPairB : config.kitchenPairA;

  const kitchenTask = config.weekendTasks.find((t) => t.id === "kitchen");
  const bathroomTask = config.weekendTasks.find((t) => t.id === "bathroom");
  const roomTask = config.weekendTasks.find((t) => t.id === "room");

  const assignments: WeekendAssignment[] = [];

  for (const task of config.weekendTasks) {
    if (task.id === "kitchen" && kitchenTask) {
      assignments.push({
        taskId: task.id,
        personIds: [...kitchenPair].slice(0, task.slots),
      });
    } else if (task.id === "bathroom" && bathroomTask) {
      assignments.push({
        taskId: task.id,
        personIds: otherPair[0] ? [otherPair[0]] : [],
      });
    } else if (task.id === "room" && roomTask) {
      assignments.push({
        taskId: task.id,
        personIds: otherPair[1] ? [otherPair[1]] : [],
      });
    } else {
      assignments.push({
        taskId: task.id,
        personIds: config.personIds.slice(0, task.slots),
      });
    }
  }

  return assignments;
}

function countSaturdaysSinceEpoch(date: Date): number {
  const epoch = parseDateKey(ROTATION_EPOCH);
  let count = 0;
  const current = new Date(epoch);

  while (current <= date) {
    if (current.getDay() === 6) count++;
    current.setDate(current.getDate() + 1);
  }

  return count - 1;
}

export function getWeekDates(center: Date): Date[] {
  const dates: Date[] = [];
  const start = new Date(center);
  start.setDate(start.getDate() - 3);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export function formatDisplayDate(date: Date): string {
  return `${formatWeekdayShort(date)}, ${date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  })}`;
}

export function formatWeekdayShort(date: Date): string {
  return date
    .toLocaleDateString("en-US", { weekday: "short" })
    .slice(0, 3);
}

export function isToday(date: Date): boolean {
  const now = new Date();
  return toDateKey(date) === toDateKey(now);
}

export function isTomorrow(date: Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return toDateKey(date) === toDateKey(tomorrow);
}

export function personName(
  id: PersonId,
  config: HouseholdConfig = DEFAULT_HOUSEHOLD_CONFIG,
): string {
  return config.people.find((p) => p.id === id)?.name ?? id;
}

export function taskName(
  id: DailyTaskId,
  config: HouseholdConfig = DEFAULT_HOUSEHOLD_CONFIG,
): string {
  return config.dailyTasks.find((t) => t.id === id)?.name ?? id;
}

export function weekendTaskName(
  id: WeekendTaskId,
  config: HouseholdConfig = DEFAULT_HOUSEHOLD_CONFIG,
): string {
  return config.weekendTasks.find((t) => t.id === id)?.name ?? id;
}

// Legacy exports for modules that still import counts from rotation
export const DAILY_TASK_COUNT = DAILY_TASKS.length;
export const WEEKEND_TASK_COUNT = WEEKEND_TASKS.length;
