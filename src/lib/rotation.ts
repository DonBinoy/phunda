import {
  BASELINE_PERSON_TASKS,
  DAILY_TASKS,
  KITCHEN_PAIR_A,
  KITCHEN_PAIR_B,
  PEOPLE,
  PERSON_IDS,
  ROTATION_EPOCH,
  TASK_ROTATION,
  WEEKEND_KITCHEN_OFFSET,
  WEEKEND_TASKS,
} from "./constants";
import type {
  DailyAssignment,
  DailyTaskId,
  PersonId,
  WeekendAssignment,
  WeekendTaskId,
} from "./types";

const INDEX_TASK: DailyTaskId[] = ["paathram", "veg", "kari", "rice"];

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

export const DAILY_TASK_COUNT = 4;
export const WEEKEND_TASK_COUNT = 3;

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
): number {
  const daily = isOutsideEatingDay(date, outsideEatingDays) ? 0 : DAILY_TASK_COUNT;
  return daily + (isWeekend(date) ? WEEKEND_TASK_COUNT : 0);
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

function taskIndexForPerson(personId: PersonId, dayOffset: number): number {
  let idx = BASELINE_PERSON_TASKS[personId];
  const steps = ((dayOffset % 4) + 4) % 4;
  for (let i = 0; i < steps; i++) {
    idx = TASK_ROTATION[idx];
  }
  return idx;
}

function buildDailyAssignments(dayOffset: number): DailyAssignment[] {
  const byTask = new Map<DailyTaskId, PersonId>();

  for (const personId of PERSON_IDS) {
    const taskIdx = taskIndexForPerson(personId, dayOffset);
    byTask.set(INDEX_TASK[taskIdx], personId);
  }

  return DAILY_TASKS.map((task) => ({
    taskId: task.id,
    personId: byTask.get(task.id)!,
  }));
}

export function getDailyAssignments(
  date: Date,
  outsideEatingDays: ReadonlySet<string> = new Set(),
): DailyAssignment[] {
  if (isOutsideEatingDay(date, outsideEatingDays)) return [];
  const offset = getDailyAssignmentOffset(date, outsideEatingDays);
  return buildDailyAssignments(offset);
}

export function getPersonDailyTask(
  personId: PersonId,
  date: Date,
  outsideEatingDays: ReadonlySet<string> = new Set(),
): DailyTaskId | null {
  if (isOutsideEatingDay(date, outsideEatingDays)) return null;
  const offset = getDailyAssignmentOffset(date, outsideEatingDays);
  const taskIdx = taskIndexForPerson(personId, offset);
  return INDEX_TASK[taskIdx];
}

export function getWeekendAssignments(date: Date): WeekendAssignment[] {
  const saturdays = countSaturdaysSinceEpoch(date);
  const weekIndex =
    (((saturdays + WEEKEND_KITCHEN_OFFSET) % 2) + 2) % 2;
  const kitchenPair = weekIndex === 0 ? KITCHEN_PAIR_A : KITCHEN_PAIR_B;
  const otherPair = weekIndex === 0 ? KITCHEN_PAIR_B : KITCHEN_PAIR_A;

  return [
    { taskId: "kitchen", personIds: [...kitchenPair] },
    { taskId: "bathroom", personIds: [otherPair[0]] },
    { taskId: "room", personIds: [otherPair[1]] },
  ];
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

export function personName(id: PersonId): string {
  return PEOPLE.find((p) => p.id === id)?.name ?? id;
}

export function taskName(id: DailyTaskId): string {
  return DAILY_TASKS.find((t) => t.id === id)?.name ?? id;
}

export function weekendTaskName(id: WeekendTaskId): string {
  return WEEKEND_TASKS.find((t) => t.id === id)?.name ?? id;
}
