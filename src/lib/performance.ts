import { ROTATION_EPOCH } from "./constants";
import {
  DEFAULT_HOUSEHOLD_CONFIG,
  type HouseholdConfig,
} from "./householdConfig";
import {
  getDailyAssignments,
  getWeekendAssignments,
  isOutsideEatingDay,
  isWeekend,
  parseDateKey,
  toDateKey,
} from "./rotation";
import type {
  CompletionsStore,
  CustomTask,
  PersonId,
  TodoList,
} from "./types";

export type PerformancePeriod = "week" | "month" | "all";

export interface CategoryStats {
  assigned: number;
  completed: number;
}

export interface PersonPerformance {
  personId: PersonId;
  name: string;
  daily: CategoryStats;
  weekend: CategoryStats;
  custom: CategoryStats;
  todo: CategoryStats;
  assigned: number;
  completed: number;
  rate: number;
  pending: number;
}

export interface PerformanceSummary {
  from: string;
  to: string;
  periodLabel: string;
  people: PersonPerformance[];
  topPerformer: PersonId | null;
  totalAssigned: number;
  totalCompleted: number;
  overallRate: number;
}

export interface MonthlyPodium {
  year: number;
  month: number; // 0-11
  monthKey: string; // YYYY-MM
  label: string;
  from: string;
  to: string;
  isComplete: boolean;
  places: Array<PersonPerformance | null>; // [gold, silver, bronze]
}

function emptyCategory(): CategoryStats {
  return { assigned: 0, completed: 0 };
}

function emptyPerson(
  personId: PersonId,
  config: HouseholdConfig = DEFAULT_HOUSEHOLD_CONFIG,
): PersonPerformance {
  return {
    personId,
    name: config.people.find((p) => p.id === personId)?.name ?? personId,
    daily: emptyCategory(),
    weekend: emptyCategory(),
    custom: emptyCategory(),
    todo: emptyCategory(),
    assigned: 0,
    completed: 0,
    rate: 0,
    pending: 0,
  };
}

function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export function getMonthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function getPerformanceRange(
  period: PerformancePeriod,
  now = new Date(),
): { from: string; to: string; periodLabel: string } {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const to = toDateKey(today);

  if (period === "week") {
    const from = startOfWeek(today);
    return {
      from: toDateKey(from),
      to,
      periodLabel: "This week (Mon–today)",
    };
  }

  if (period === "month") {
    return {
      from: toDateKey(startOfMonth(today)),
      to,
      periodLabel: monthLabel(today.getFullYear(), today.getMonth()),
    };
  }

  const epoch = parseDateKey(ROTATION_EPOCH);
  return {
    from: toDateKey(epoch),
    to,
    periodLabel: "All time",
  };
}

export function getMonthRange(
  year: number,
  month: number,
  now = new Date(),
): { from: string; to: string; isComplete: boolean } {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const fromDate = startOfMonth(new Date(year, month, 1));
  const monthEnd = endOfMonth(new Date(year, month, 1));
  const isCurrent =
    year === today.getFullYear() && month === today.getMonth();
  const toDate = isCurrent ? today : monthEnd;
  return {
    from: toDateKey(fromDate),
    to: toDateKey(toDate),
    isComplete: !isCurrent && monthEnd < today,
  };
}

function eachDate(fromKey: string, toKey: string): Date[] {
  const dates: Date[] = [];
  const current = parseDateKey(fromKey);
  const end = parseDateKey(toKey);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function finalizePeople(
  byPerson: Record<PersonId, PersonPerformance>,
  config: HouseholdConfig = DEFAULT_HOUSEHOLD_CONFIG,
): PersonPerformance[] {
  return config.personIds.map((id) => {
    const person = byPerson[id];
    person.assigned =
      person.daily.assigned +
      person.weekend.assigned +
      person.custom.assigned +
      person.todo.assigned;
    person.completed =
      person.daily.completed +
      person.weekend.completed +
      person.custom.completed +
      person.todo.completed;
    person.pending = person.assigned - person.completed;
    person.rate =
      person.assigned > 0
        ? Math.round((person.completed / person.assigned) * 100)
        : 0;
    return person;
  }).sort((a, b) => {
    if (b.completed !== a.completed) return b.completed - a.completed;
    if (b.rate !== a.rate) return b.rate - a.rate;
    return a.name.localeCompare(b.name);
  });
}

export function computePerformanceForRange(
  from: string,
  to: string,
  periodLabel: string,
  completions: CompletionsStore,
  customTasks: CustomTask[],
  todos: TodoList[],
  outsideEatingDays: ReadonlySet<string>,
  config: HouseholdConfig = DEFAULT_HOUSEHOLD_CONFIG,
): PerformanceSummary {
  const byPerson = Object.fromEntries(
    config.personIds.map((id) => [id, emptyPerson(id, config)]),
  ) as Record<PersonId, PersonPerformance>;

  for (const date of eachDate(from, to)) {
    const dateKey = toDateKey(date);
    const dayComp = completions[dateKey];

    if (!isOutsideEatingDay(date, outsideEatingDays)) {
      for (const { taskId, personId } of getDailyAssignments(
        date,
        outsideEatingDays,
        config,
      )) {
        const person = byPerson[personId];
        if (!person) continue;
        person.daily.assigned++;
        if (dayComp?.daily?.[taskId]) person.daily.completed++;
      }
    }

    if (isWeekend(date)) {
      for (const { taskId, personIds } of getWeekendAssignments(date, config)) {
        const done = !!dayComp?.weekend?.[taskId];
        for (const personId of personIds) {
          const person = byPerson[personId];
          if (!person) continue;
          person.weekend.assigned++;
          if (done) person.weekend.completed++;
        }
      }
    }
  }

  for (const task of customTasks) {
    if (task.date < from || task.date > to) continue;
    const person = byPerson[task.personId];
    if (!person) continue;
    person.custom.assigned++;
    if (task.completed) person.custom.completed++;
  }

  for (const list of todos) {
    if (list.date < from || list.date > to) continue;
    const person = byPerson[list.personId];
    if (!person) continue;
    for (const item of list.items) {
      person.todo.assigned++;
      if (item.completed) person.todo.completed++;
    }
  }

  const people = finalizePeople(byPerson, config);
  const totalAssigned = people.reduce((sum, p) => sum + p.assigned, 0);
  const totalCompleted = people.reduce((sum, p) => sum + p.completed, 0);
  const withWork = people.filter((p) => p.assigned > 0);
  const topPerformer =
    withWork.length > 0 && withWork[0].completed > 0
      ? withWork[0].personId
      : null;

  return {
    from,
    to,
    periodLabel,
    people,
    topPerformer,
    totalAssigned,
    totalCompleted,
    overallRate:
      totalAssigned > 0
        ? Math.round((totalCompleted / totalAssigned) * 100)
        : 0,
  };
}

export function computePerformance(
  period: PerformancePeriod,
  completions: CompletionsStore,
  customTasks: CustomTask[],
  todos: TodoList[],
  outsideEatingDays: ReadonlySet<string>,
  now = new Date(),
  config: HouseholdConfig = DEFAULT_HOUSEHOLD_CONFIG,
): PerformanceSummary {
  const { from, to, periodLabel } = getPerformanceRange(period, now);
  return computePerformanceForRange(
    from,
    to,
    periodLabel,
    completions,
    customTasks,
    todos,
    outsideEatingDays,
    config,
  );
}

export function computeMonthlyPodium(
  year: number,
  month: number,
  completions: CompletionsStore,
  customTasks: CustomTask[],
  todos: TodoList[],
  outsideEatingDays: ReadonlySet<string>,
  now = new Date(),
  config: HouseholdConfig = DEFAULT_HOUSEHOLD_CONFIG,
): MonthlyPodium {
  const { from, to, isComplete } = getMonthRange(year, month, now);
  const summary = computePerformanceForRange(
    from,
    to,
    monthLabel(year, month),
    completions,
    customTasks,
    todos,
    outsideEatingDays,
    config,
  );

  const ranked = summary.people.filter((p) => p.completed > 0);
  const places: Array<PersonPerformance | null> = [
    ranked[0] ?? null,
    ranked[1] ?? null,
    ranked[2] ?? null,
  ];

  return {
    year,
    month,
    monthKey: getMonthKey(year, month),
    label: monthLabel(year, month),
    from,
    to,
    isComplete,
    places,
  };
}

/** Current month + previous months back to epoch (newest first). */
export function listPodiumMonths(now = new Date()): Array<{
  year: number;
  month: number;
}> {
  const epoch = parseDateKey(ROTATION_EPOCH);
  const months: Array<{ year: number; month: number }> = [];
  let y = now.getFullYear();
  let m = now.getMonth();
  const epochY = epoch.getFullYear();
  const epochM = epoch.getMonth();

  while (y > epochY || (y === epochY && m >= epochM)) {
    months.push({ year: y, month: m });
    m -= 1;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
  }
  return months;
}

/** Longest streak of days where person completed all assigned chores that day. */
export function computeCompletionStreak(
  personId: PersonId,
  completions: CompletionsStore,
  outsideEatingDays: ReadonlySet<string>,
  now = new Date(),
  config: HouseholdConfig = DEFAULT_HOUSEHOLD_CONFIG,
): number {
  const epoch = parseDateKey(ROTATION_EPOCH);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let streak = 0;
  const cursor = new Date(today);

  while (cursor >= epoch) {
    const { assigned, completed } = personDayChores(
      personId,
      cursor,
      completions,
      outsideEatingDays,
      config,
    );

    if (assigned === 0) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    if (completed === assigned) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    break;
  }

  return streak;
}

function personDayChores(
  personId: PersonId,
  date: Date,
  completions: CompletionsStore,
  outsideEatingDays: ReadonlySet<string>,
  config: HouseholdConfig = DEFAULT_HOUSEHOLD_CONFIG,
): { assigned: number; completed: number } {
  const dateKey = toDateKey(date);
  let assigned = 0;
  let completed = 0;

  if (!isOutsideEatingDay(date, outsideEatingDays)) {
    for (const a of getDailyAssignments(date, outsideEatingDays, config)) {
      if (a.personId !== personId) continue;
      assigned++;
      if (completions[dateKey]?.daily?.[a.taskId]) completed++;
    }
  }

  if (isWeekend(date)) {
    for (const a of getWeekendAssignments(date, config)) {
      if (!a.personIds.includes(personId)) continue;
      assigned++;
      if (completions[dateKey]?.weekend?.[a.taskId]) completed++;
    }
  }

  return { assigned, completed };
}

/** Best historical full-clear streak for a person. */
export function computeBestStreak(
  personId: PersonId,
  completions: CompletionsStore,
  outsideEatingDays: ReadonlySet<string>,
  now = new Date(),
  config: HouseholdConfig = DEFAULT_HOUSEHOLD_CONFIG,
): number {
  const epoch = parseDateKey(ROTATION_EPOCH);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let best = 0;
  let current = 0;
  const cursor = new Date(epoch);

  while (cursor <= today) {
    const { assigned, completed } = personDayChores(
      personId,
      cursor,
      completions,
      outsideEatingDays,
      config,
    );

    if (assigned === 0) {
      // empty days don't break or grow
    } else if (completed === assigned) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 0;
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return best;
}

export function countPerfectDays(
  personId: PersonId,
  completions: CompletionsStore,
  outsideEatingDays: ReadonlySet<string>,
  now = new Date(),
  config: HouseholdConfig = DEFAULT_HOUSEHOLD_CONFIG,
): number {
  const epoch = parseDateKey(ROTATION_EPOCH);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let count = 0;
  const cursor = new Date(epoch);

  while (cursor <= today) {
    const { assigned, completed } = personDayChores(
      personId,
      cursor,
      completions,
      outsideEatingDays,
      config,
    );
    if (assigned > 0 && completed === assigned) count++;
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

/** Count completed daily chores by task type for a person. */
export function countDailyTaskCompletions(
  personId: PersonId,
  completions: CompletionsStore,
  outsideEatingDays: ReadonlySet<string>,
  now = new Date(),
  config: HouseholdConfig = DEFAULT_HOUSEHOLD_CONFIG,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const task of config.dailyTasks) {
    counts[task.id] = 0;
  }
  const epoch = parseDateKey(ROTATION_EPOCH);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const cursor = new Date(epoch);

  while (cursor <= today) {
    if (!isOutsideEatingDay(cursor, outsideEatingDays)) {
      const dateKey = toDateKey(cursor);
      for (const a of getDailyAssignments(cursor, outsideEatingDays, config)) {
        if (a.personId !== personId) continue;
        if (completions[dateKey]?.daily?.[a.taskId]) {
          counts[a.taskId] = (counts[a.taskId] ?? 0) + 1;
        }
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return counts;
}

/** True if person ever fully cleared chores on a Sunday. */
export function hasSundayPerfect(
  personId: PersonId,
  completions: CompletionsStore,
  outsideEatingDays: ReadonlySet<string>,
  now = new Date(),
  config: HouseholdConfig = DEFAULT_HOUSEHOLD_CONFIG,
): boolean {
  const epoch = parseDateKey(ROTATION_EPOCH);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const cursor = new Date(epoch);

  while (cursor <= today) {
    if (cursor.getDay() === 0) {
      const { assigned, completed } = personDayChores(
        personId,
        cursor,
        completions,
        outsideEatingDays,
        config,
      );
      if (assigned > 0 && completed === assigned) return true;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return false;
}

export function countWeekendTaskCompletions(
  personId: PersonId,
  completions: CompletionsStore,
  now = new Date(),
  config: HouseholdConfig = DEFAULT_HOUSEHOLD_CONFIG,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const task of config.weekendTasks) {
    counts[task.id] = 0;
  }
  const epoch = parseDateKey(ROTATION_EPOCH);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const cursor = new Date(epoch);

  while (cursor <= today) {
    if (isWeekend(cursor)) {
      const dateKey = toDateKey(cursor);
      for (const a of getWeekendAssignments(cursor, config)) {
        if (!a.personIds.includes(personId)) continue;
        if (completions[dateKey]?.weekend?.[a.taskId]) {
          counts[a.taskId] = (counts[a.taskId] ?? 0) + 1;
        }
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return counts;
}

/** Max perfect days within any single Mon–Sun week. */
export function maxPerfectDaysInWeek(
  personId: PersonId,
  completions: CompletionsStore,
  outsideEatingDays: ReadonlySet<string>,
  now = new Date(),
  config: HouseholdConfig = DEFAULT_HOUSEHOLD_CONFIG,
): number {
  const epoch = parseDateKey(ROTATION_EPOCH);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let best = 0;
  let weekCount = 0;
  const cursor = new Date(epoch);

  while (cursor <= today) {
    const { assigned, completed } = personDayChores(
      personId,
      cursor,
      completions,
      outsideEatingDays,
      config,
    );
    if (assigned > 0 && completed === assigned) weekCount++;

    if (cursor.getDay() === 0 || toDateKey(cursor) === toDateKey(today)) {
      best = Math.max(best, weekCount);
      if (cursor.getDay() === 0) weekCount = 0;
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return best;
}

/** Perfect clear on the last day of any month. */
export function hasClutchMonthFinish(
  personId: PersonId,
  completions: CompletionsStore,
  outsideEatingDays: ReadonlySet<string>,
  now = new Date(),
  config: HouseholdConfig = DEFAULT_HOUSEHOLD_CONFIG,
): boolean {
  const epoch = parseDateKey(ROTATION_EPOCH);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let y = epoch.getFullYear();
  let m = epoch.getMonth();

  while (
    y < today.getFullYear() ||
    (y === today.getFullYear() && m <= today.getMonth())
  ) {
    const last = new Date(y, m + 1, 0);
    if (last <= today) {
      const { assigned, completed } = personDayChores(
        personId,
        last,
        completions,
        outsideEatingDays,
        config,
      );
      if (assigned > 0 && completed === assigned) return true;
    }
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
  }
  return false;
}

export interface SeasonInfo {
  year: number;
  quarter: 1 | 2 | 3 | 4;
  label: string;
  from: string;
  to: string;
  monthIndexes: number[];
}

export function getSeasonInfo(now = new Date()): SeasonInfo {
  const month = now.getMonth();
  const year = now.getFullYear();
  const quarter = (Math.floor(month / 3) + 1) as 1 | 2 | 3 | 4;
  const startMonth = (quarter - 1) * 3;
  const fromDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 3, 0);
  const today = new Date(year, month, now.getDate());
  const toDate = endDate < today ? endDate : today;

  return {
    year,
    quarter,
    label: `Q${quarter} ${year} House Cup`,
    from: toDateKey(fromDate),
    to: toDateKey(toDate),
    monthIndexes: [startMonth, startMonth + 1, startMonth + 2],
  };
}

export interface HouseCupStanding {
  personId: PersonId;
  name: string;
  points: number;
  gold: number;
  silver: number;
  bronze: number;
  completed: number;
}

/** Season cup: gold=5, silver=3, bronze=1, plus 1 point per completed chore. */
export function computeHouseCup(
  completions: CompletionsStore,
  customTasks: CustomTask[],
  todos: TodoList[],
  outsideEatingDays: ReadonlySet<string>,
  now = new Date(),
  config: HouseholdConfig = DEFAULT_HOUSEHOLD_CONFIG,
): {
  season: SeasonInfo;
  standings: HouseCupStanding[];
  champion: PersonId | null;
} {
  const season = getSeasonInfo(now);
  const byPerson = Object.fromEntries(
    config.personIds.map((id) => [
      id,
      {
        personId: id,
        name: config.people.find((p) => p.id === id)?.name ?? id,
        points: 0,
        gold: 0,
        silver: 0,
        bronze: 0,
        completed: 0,
      } satisfies HouseCupStanding,
    ]),
  ) as Record<PersonId, HouseCupStanding>;

  for (const month of season.monthIndexes) {
    const podium = computeMonthlyPodium(
      season.year,
      month,
      completions,
      customTasks,
      todos,
      outsideEatingDays,
      now,
      config,
    );

    const [g, s, b] = podium.places;
    if (g) {
      byPerson[g.personId].gold++;
      byPerson[g.personId].points += 5;
    }
    if (s) {
      byPerson[s.personId].silver++;
      byPerson[s.personId].points += 3;
    }
    if (b) {
      byPerson[b.personId].bronze++;
      byPerson[b.personId].points += 1;
    }
  }

  const chores = computePerformanceForRange(
    season.from,
    season.to,
    season.label,
    completions,
    customTasks,
    todos,
    outsideEatingDays,
    config,
  );
  for (const p of chores.people) {
    byPerson[p.personId].completed = p.completed;
    byPerson[p.personId].points += p.completed;
  }

  const standings = config.personIds.map((id) => byPerson[id]).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gold !== a.gold) return b.gold - a.gold;
    return b.completed - a.completed;
  });

  const champion =
    standings[0] && standings[0].points > 0 ? standings[0].personId : null;

  return { season, standings, champion };
}
