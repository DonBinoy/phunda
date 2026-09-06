"use client";

import { useHouseholdConfig } from "@/context/HouseholdConfigContext";
import {
  formatDisplayDate,
  formatWeekdayShort,
  getDailyAssignments,
  getPersonDailyTask,
  getWeekendAssignments,
  hasRescheduledDailyChores,
  isOutsideEatingDay,
  isToday,
  isTomorrow,
  personName,
  toDateKey,
} from "@/lib/rotation";
import {
  completionCountForDateFull,
  totalTaskCountForDate,
} from "@/lib/tasks";
import type {
  CompletionsStore,
  CustomTask,
  DailyTaskId,
  PersonId,
  ViewScope,
  WeekendTaskId,
} from "@/lib/types";
import { Section } from "@/components/ui/Section";
import { getPersonColors } from "@/lib/personColors";

interface TaskCardProps {
  title: string;
  assignee: string;
  completed: boolean;
  onToggle: () => void;
  highlight?: "today" | "tomorrow";
}

export function TaskCard({
  title,
  assignee,
  completed,
  onToggle,
  highlight,
}: TaskCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`group glass-card-hover w-full rounded-2xl border p-4 text-left transition-all active:scale-[0.99] ${
        completed
          ? "border-sea-700/40 bg-sea-900/15 opacity-80"
          : highlight === "today"
            ? "border-sea-500/40 bg-sea-500/8 shadow-sm shadow-sea-500/5"
            : highlight === "tomorrow"
              ? "border-fawn-500/35 bg-fawn-500/5"
              : "border-onyx-800/80 bg-onyx-900/40 hover:border-onyx-600"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={`font-medium leading-snug ${completed ? "text-onyx-500 line-through" : "text-onyx-100"}`}
          >
            {title}
          </p>
          <p className="mt-1.5 text-xs text-pine-400">{assignee}</p>
        </div>
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
            completed
              ? "border-sea-500 bg-sea-500 text-onyx-950"
              : "border-onyx-600 group-hover:border-sea-500 group-hover:bg-sea-500/10"
          }`}
        >
          {completed && (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}

interface DailyTasksProps {
  date: Date;
  completions: CompletionsStore;
  outsideEatingDays: ReadonlySet<string>;
  viewScope: ViewScope;
  onToggle: (dateKey: string, taskId: DailyTaskId) => void;
  onToggleOutsideEating: (dateKey: string) => void;
  onAddDailyChore?: () => void;
}

export function DailyTasks({
  date,
  completions,
  outsideEatingDays,
  viewScope,
  onToggle,
  onToggleOutsideEating,
  onAddDailyChore,
}: DailyTasksProps) {
  const { config, dailyTasks } = useHouseholdConfig();
  const dateKey = toDateKey(date);
  const assignments = getDailyAssignments(date, outsideEatingDays, config).filter(
    (a) => viewScope.isAdmin || a.personId === viewScope.personId,
  );
  const dayCompletions = completions[dateKey]?.daily ?? {};
  const highlight = isToday(date) ? "today" : isTomorrow(date) ? "tomorrow" : undefined;
  const ateOutside = isOutsideEatingDay(date, outsideEatingDays);
  const rescheduled = hasRescheduledDailyChores(date, outsideEatingDays);

  return (
    <Section
      title={viewScope.isAdmin ? "Daily chores" : "Your daily chore"}
      action={
        <div className="flex flex-wrap items-center gap-2">
          {highlight && (
            <span
              className={`chip ${
                highlight === "today"
                  ? "bg-sea-500/20 text-sea-400 ring-1 ring-sea-500/30"
                  : "bg-fawn-500/20 text-fawn-400 ring-1 ring-fawn-500/30"
              }`}
            >
              {highlight === "today" ? "Today" : "Tomorrow"}
            </span>
          )}
          {viewScope.isAdmin && onAddDailyChore && (
            <button
              type="button"
              onClick={onAddDailyChore}
              className="chip border border-fawn-500/40 bg-fawn-500/15 text-fawn-300 transition-colors hover:bg-fawn-500/25"
            >
              + Add Daily Chore
            </button>
          )}
          {viewScope.isAdmin && (
            <button
              type="button"
              onClick={() => onToggleOutsideEating(dateKey)}
              className={`chip transition-colors ${
                ateOutside
                  ? "bg-fawn-500/20 text-fawn-300 ring-1 ring-fawn-500/40"
                  : "border border-onyx-700 bg-onyx-800 text-onyx-400 hover:text-onyx-200"
              }`}
            >
              {ateOutside ? "Ate outside ✓" : "Mark ate outside"}
            </button>
          )}
        </div>
      }
    >

      {ateOutside && (
        <p className="rounded-lg border border-fawn-500/30 bg-fawn-500/10 px-3 py-2 text-sm text-fawn-300">
          {viewScope.isAdmin
            ? "No cooking today — daily chores move to tomorrow."
            : "Ate outside today — your chore moves to tomorrow."}
        </p>
      )}

      {rescheduled && !ateOutside && (
        <p className="rounded-lg border border-sea-700/40 bg-sea-900/20 px-3 py-2 text-sm text-sea-300">
          Includes chores rescheduled from a day you ate outside.
        </p>
      )}

      {assignments.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {assignments.map(({ taskId, personId }) => {
            const task = dailyTasks.find((t) => t.id === taskId);
            if (!task) return null;
            return (
              <TaskCard
                key={taskId}
                title={task.name}
                assignee={personName(personId, config)}
                completed={!!dayCompletions[taskId]}
                onToggle={() => onToggle(dateKey, taskId)}
                highlight={highlight}
              />
            );
          })}
        </div>
      ) : (
        !ateOutside && viewScope.isAdmin && (
          <p className="text-sm text-onyx-500">No daily chores for this day.</p>
        )
      )}
    </Section>
  );
}

interface WeekendTasksProps {
  date: Date;
  completions: CompletionsStore;
  viewScope: ViewScope;
  onToggle: (dateKey: string, taskId: WeekendTaskId) => void;
}

export function WeekendTasks({
  date,
  completions,
  viewScope,
  onToggle,
}: WeekendTasksProps) {
  const { config } = useHouseholdConfig();
  const dateKey = toDateKey(date);
  const assignments = getWeekendAssignments(date, config).filter(
    ({ personIds }) => viewScope.isAdmin || personIds.includes(viewScope.personId),
  );
  const dayCompletions = completions[dateKey]?.weekend ?? {};
  const highlight = isToday(date) ? "today" : isTomorrow(date) ? "tomorrow" : undefined;

  return (
    <Section
      title={viewScope.isAdmin ? "Weekend cleaning" : "Your weekend cleaning"}
      subtitle={
        viewScope.isAdmin
          ? "Kitchen alternates between Bijo & Adithyan, then Don & Suraj"
          : "Kitchen cleaning rotates between pairs each weekend"
      }
      action={
        highlight ? (
          <span
            className={`chip ${
              highlight === "today"
                ? "bg-sea-500/20 text-sea-400 ring-1 ring-sea-500/30"
                : "bg-fawn-500/20 text-fawn-400 ring-1 ring-fawn-500/30"
            }`}
          >
            {highlight === "today" ? "Today" : "Tomorrow"}
          </span>
        ) : undefined
      }
    >
      {assignments.length === 0 ? (
        <p className="text-sm text-onyx-500">No weekend cleaning assigned to you.</p>
      ) : (
      <div className="grid gap-2">
        {assignments.map(({ taskId, personIds }) => {
          const names = personIds.map((id) => personName(id, config)).join(" & ");
          const task = config.weekendTasks.find((t) => t.id === taskId);
          return (
            <TaskCard
              key={taskId}
              title={task?.name ?? taskId}
              assignee={names}
              completed={!!dayCompletions[taskId]}
              onToggle={() => onToggle(dateKey, taskId)}
              highlight={highlight}
            />
          );
        })}
      </div>
      )}
    </Section>
  );
}

interface TaskCalendarProps {
  centerDate: Date;
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
  completions: CompletionsStore;
  customByDate: Record<string, CustomTask[]>;
  outsideEatingDays: ReadonlySet<string>;
  viewScope: ViewScope;
}

export function TaskCalendar({
  centerDate,
  onSelectDate,
  selectedDate,
  completions,
  customByDate,
  outsideEatingDays,
  viewScope,
}: TaskCalendarProps) {
  const { config } = useHouseholdConfig();
  const dates: Date[] = [];
  const start = new Date(centerDate);
  start.setDate(start.getDate() - 3);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }

  return (
    <Section title="Week at a glance" subtitle="Tap a day to view tasks">
      <div className="grid grid-cols-7 gap-2">
        {dates.map((date) => {
          const key = toDateKey(date);
          const selected = toDateKey(selectedDate) === key;
          const today = isToday(date);
          const custom = customByDate[key] ?? [];
          const totalTasks = totalTaskCountForDate(
            date,
            custom,
            [],
            outsideEatingDays,
            viewScope,
            config,
          );
          const doneCount = completionCountForDateFull(
            date,
            completions,
            custom,
            [],
            outsideEatingDays,
            viewScope,
            config,
          );
          const allDone = totalTasks > 0 && doneCount === totalTasks;
          const ateOutside = isOutsideEatingDay(date, outsideEatingDays);
          const pct =
            totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(date)}
              className={`relative flex flex-col items-center rounded-2xl border p-2.5 text-center transition-all sm:p-3 ${
                selected
                  ? "border-sea-500/60 bg-sea-500/15 ring-1 ring-sea-500/30 shadow-lg shadow-sea-500/10"
                  : today
                    ? "border-fawn-500/40 bg-fawn-500/8"
                    : ateOutside
                      ? "border-fawn-600/25 bg-fawn-500/5"
                      : "border-onyx-800/80 bg-onyx-900/30 hover:border-onyx-600 hover:bg-onyx-800/50"
              }`}
            >
              <span className="text-[10px] font-medium uppercase text-onyx-500">
                {formatWeekdayShort(date)}
              </span>
              <span
                className={`mt-0.5 text-base font-bold ${today ? "text-fawn-400" : selected ? "text-sea-300" : "text-onyx-100"}`}
              >
                {date.getDate()}
              </span>
              {ateOutside ? (
                <span className="mt-1 text-[10px] font-medium text-fawn-500">out</span>
              ) : totalTasks === 0 ? (
                <span className="mt-1 text-[10px] text-onyx-600">—</span>
              ) : allDone ? (
                <span className="mt-1 text-[10px] font-bold text-sea-500">✓</span>
              ) : (
                <span className="mt-1 text-[10px] text-onyx-500">
                  {doneCount}/{totalTasks}
                </span>
              )}
              {totalTasks > 0 && !ateOutside && (
                <div className="absolute bottom-1.5 left-2 right-2 h-0.5 overflow-hidden rounded-full bg-onyx-800">
                  <div
                    className="h-full rounded-full bg-sea-500/70"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </Section>
  );
}

interface PersonOverviewProps {
  date: Date;
  outsideEatingDays: ReadonlySet<string>;
  viewScope: ViewScope;
}

export function PersonOverview({
  date,
  outsideEatingDays,
  viewScope,
}: PersonOverviewProps) {
  const { config, people: allPeople, dailyTasks, personIds } = useHouseholdConfig();
  const ateOutside = isOutsideEatingDay(date, outsideEatingDays);
  const people = viewScope.isAdmin
    ? allPeople
    : allPeople.filter((p) => p.id === viewScope.personId);

  return (
    <Section
      title={viewScope.isAdmin ? "Team overview" : "Your chore"}
      subtitle={formatDisplayDate(date)}
    >
      <div className="grid gap-2">
        {people.map((person) => {
          const taskId = getPersonDailyTask(person.id, date, outsideEatingDays, config);
          const task = taskId ? dailyTasks.find((t) => t.id === taskId) : null;
          const colors = getPersonColors(person.id, personIds);
          return (
            <div
              key={person.id}
              className={`flex items-center gap-3 rounded-2xl border border-onyx-800/80 bg-gradient-to-r ${colors.gradient} px-4 py-3.5`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ring-1 ${colors.bg} ${colors.ring} ${colors.text}`}
              >
                {person.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-onyx-100">{person.name}</p>
                <p className="text-sm text-onyx-400">
                  {ateOutside ? "Off — ate outside" : (task?.shortName ?? "—")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
