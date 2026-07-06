"use client";

import { DAILY_TASKS, PEOPLE } from "@/lib/constants";
import {
  formatDisplayDate,
  getDailyAssignments,
  getWeekendAssignments,
  isToday,
  isTomorrow,
  personName,
  toDateKey,
} from "@/lib/rotation";
import {
  completionCountForDateFull,
  totalTaskCountForDate,
} from "@/lib/tasks";
import type { CompletionsStore, CustomTask, DailyTaskId, TodoList, WeekendTaskId } from "@/lib/types";

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
      className={`group w-full rounded-xl border p-4 text-left transition-all ${
        completed
          ? "border-sea-700/50 bg-sea-900/20 opacity-75"
          : highlight === "today"
            ? "border-sea-500/50 bg-sea-500/5 hover:border-sea-400"
            : highlight === "tomorrow"
              ? "border-fawn-500/40 bg-fawn-500/5 hover:border-fawn-400"
              : "border-onyx-700 bg-onyx-900 hover:border-onyx-600"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={`font-medium ${completed ? "text-onyx-400 line-through" : "text-onyx-100"}`}
          >
            {title}
          </p>
          <p className="mt-1 text-sm text-pine-400">{assignee}</p>
        </div>
        <div
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            completed
              ? "border-sea-500 bg-sea-500 text-onyx-950"
              : "border-onyx-600 group-hover:border-sea-500"
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
  onToggle: (dateKey: string, taskId: DailyTaskId) => void;
}

export function DailyTasks({ date, completions, onToggle }: DailyTasksProps) {
  const dateKey = toDateKey(date);
  const assignments = getDailyAssignments(date);
  const dayCompletions = completions[dateKey]?.daily ?? {};
  const highlight = isToday(date) ? "today" : isTomorrow(date) ? "tomorrow" : undefined;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-onyx-400">
          Daily chores
        </h3>
        {highlight && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              highlight === "today"
                ? "bg-sea-500/20 text-sea-400"
                : "bg-fawn-500/20 text-fawn-400"
            }`}
          >
            {highlight === "today" ? "Today" : "Tomorrow"}
          </span>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {assignments.map(({ taskId, personId }) => {
          const task = DAILY_TASKS.find((t) => t.id === taskId)!;
          return (
            <TaskCard
              key={taskId}
              title={task.name}
              assignee={personName(personId)}
              completed={!!dayCompletions[taskId]}
              onToggle={() => onToggle(dateKey, taskId)}
              highlight={highlight}
            />
          );
        })}
      </div>
    </div>
  );
}

interface WeekendTasksProps {
  date: Date;
  completions: CompletionsStore;
  onToggle: (dateKey: string, taskId: WeekendTaskId) => void;
}

export function WeekendTasks({ date, completions, onToggle }: WeekendTasksProps) {
  const dateKey = toDateKey(date);
  const assignments = getWeekendAssignments(date);
  const dayCompletions = completions[dateKey]?.weekend ?? {};
  const highlight = isToday(date) ? "today" : isTomorrow(date) ? "tomorrow" : undefined;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-onyx-400">
          Extra weekend cleaning
        </h3>
        {highlight && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              highlight === "today"
                ? "bg-sea-500/20 text-sea-400"
                : "bg-fawn-500/20 text-fawn-400"
            }`}
          >
            {highlight === "today" ? "Today" : "Tomorrow"}
          </span>
        )}
      </div>
      <div className="grid gap-2">
        {assignments.map(({ taskId, personIds }) => {
          const names = personIds.map(personName).join(" & ");
          const labels: Record<WeekendTaskId, string> = {
            kitchen: "Kitchen Cleaning",
            bathroom: "Bathroom Cleaning",
            room: "Room Cleaning",
          };
          return (
            <TaskCard
              key={taskId}
              title={labels[taskId]}
              assignee={names}
              completed={!!dayCompletions[taskId]}
              onToggle={() => onToggle(dateKey, taskId)}
              highlight={highlight}
            />
          );
        })}
      </div>
    </div>
  );
}

interface TaskCalendarProps {
  centerDate: Date;
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
  completions: CompletionsStore;
  customByDate: Record<string, CustomTask[]>;
  todosByDate: Record<string, TodoList[]>;
}

export function TaskCalendar({
  centerDate,
  onSelectDate,
  selectedDate,
  completions,
  customByDate,
  todosByDate,
}: TaskCalendarProps) {
  const dates: Date[] = [];
  const start = new Date(centerDate);
  start.setDate(start.getDate() - 3);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-onyx-400">
        Calendar
      </h3>
      <div className="grid grid-cols-7 gap-1.5">
        {dates.map((date) => {
          const key = toDateKey(date);
          const selected = toDateKey(selectedDate) === key;
          const today = isToday(date);
          const dayComp = completions[key];
          const custom = customByDate[key] ?? [];
          const dayTodos = todosByDate[key] ?? [];
          const totalTasks = totalTaskCountForDate(date, custom, dayTodos);
          const doneCount = completionCountForDateFull(
            date,
            completions,
            custom,
            dayTodos,
          );
          const allDone = totalTasks > 0 && doneCount === totalTasks;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(date)}
              className={`flex flex-col items-center rounded-xl border p-2 text-center transition-all ${
                selected
                  ? "border-sea-500 bg-sea-500/10"
                  : today
                    ? "border-fawn-500/50 bg-fawn-500/5"
                    : "border-onyx-800 bg-onyx-900 hover:border-onyx-700"
              }`}
            >
              <span className="text-[10px] uppercase text-onyx-500">
                {date.toLocaleDateString("en-IN", { weekday: "narrow" })}
              </span>
              <span
                className={`text-sm font-semibold ${today ? "text-fawn-400" : "text-onyx-200"}`}
              >
                {date.getDate()}
              </span>
              {allDone ? (
                <span className="mt-0.5 text-[10px] text-sea-500">✓</span>
              ) : (
                <span className="mt-0.5 text-[10px] text-onyx-500">
                  {doneCount}/{totalTasks}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-onyx-500">
        Tap a day to see who does what. Assignments rotate automatically.
      </p>
    </div>
  );
}

interface PersonOverviewProps {
  date: Date;
}

export function PersonOverview({ date }: PersonOverviewProps) {
  const assignments = getDailyAssignments(date);
  const byPerson = new Map(assignments.map((a) => [a.personId, a.taskId]));

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-onyx-400">
        By person — {formatDisplayDate(date)}
      </h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {PEOPLE.map((person) => {
          const taskId = byPerson.get(person.id);
          const task = DAILY_TASKS.find((t) => t.id === taskId);
          return (
            <div
              key={person.id}
              className="flex items-center gap-3 rounded-xl border border-onyx-800 bg-onyx-900/60 px-4 py-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pine-800 text-sm font-bold text-pine-200">
                {person.name[0]}
              </div>
              <div>
                <p className="font-medium text-onyx-100">{person.name}</p>
                <p className="text-sm text-onyx-400">{task?.shortName ?? "—"}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
