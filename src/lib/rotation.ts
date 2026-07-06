import {
  BASELINE_PERSON_TASKS,
  DAILY_TASKS,
  PEOPLE,
  PERSON_IDS,
  ROTATION_EPOCH,
  TASK_ROTATION,
  WEEKEND_TASKS,
} from "./constants";
import type {
  DailyAssignment,
  DailyTaskId,
  PersonId,
  WeekendAssignment,
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

export function totalTasksForDate(date: Date): number {
  return DAILY_TASK_COUNT + (isWeekend(date) ? WEEKEND_TASK_COUNT : 0);
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

export function getDailyAssignments(date: Date): DailyAssignment[] {
  const offset = daysSinceEpoch(date);
  const byTask = new Map<DailyTaskId, PersonId>();

  for (const personId of PERSON_IDS) {
    const taskIdx = taskIndexForPerson(personId, offset);
    byTask.set(INDEX_TASK[taskIdx], personId);
  }

  return DAILY_TASKS.map((task) => ({
    taskId: task.id,
    personId: byTask.get(task.id)!,
  }));
}

export function getPersonDailyTask(
  personId: PersonId,
  date: Date,
): DailyTaskId {
  const offset = daysSinceEpoch(date);
  const taskIdx = taskIndexForPerson(personId, offset);
  return INDEX_TASK[taskIdx];
}

export function getWeekendAssignments(date: Date): WeekendAssignment[] {
  const saturdays = countSaturdaysSinceEpoch(date);
  const weekIndex = ((saturdays % 4) + 4) % 4;
  const rotated = [
    PEOPLE[weekIndex % 4],
    PEOPLE[(weekIndex + 1) % 4],
    PEOPLE[(weekIndex + 2) % 4],
    PEOPLE[(weekIndex + 3) % 4],
  ];

  let cursor = 0;
  return WEEKEND_TASKS.map((task) => {
    const personIds = rotated
      .slice(cursor, cursor + task.slots)
      .map((p) => p.id);
    cursor += task.slots;
    return { taskId: task.id, personIds };
  });
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
