"use client";

import { useState } from "react";
import { useCustomTasks } from "@/hooks/useCustomTasks";
import { useCompletions } from "@/hooks/useCompletions";
import { useTodos } from "@/hooks/useTodos";
import {
  completionCountForDateFull,
  totalTaskCountForDate,
} from "@/lib/tasks";
import {
  formatDisplayDate,
  isToday,
  isWeekend,
  toDateKey,
} from "@/lib/rotation";
import { CustomTasks } from "./CustomTasks";
import { PendingTasksAlert } from "./PendingTasksAlert";
import {
  DailyTasks,
  PersonOverview,
  TaskCalendar,
  WeekendTasks,
} from "./TaskViews";

const NO_TODOS: never[] = [];

export function TaskManager() {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calendarCenter, setCalendarCenter] = useState(() => new Date());
  const { completions, loading, error, toggleDaily, toggleWeekend } =
    useCompletions(calendarCenter);
  const {
    tasks: customTasks,
    byDate: customByDate,
    loading: customLoading,
    error: customError,
    addTask,
    toggleTask,
    removeTask,
  } = useCustomTasks(calendarCenter);
  const { todos, loading: todosLoading } = useTodos(calendarCenter);

  const goToToday = () => {
    const now = new Date();
    setSelectedDate(now);
    setCalendarCenter(now);
  };

  if (loading || customLoading || todosLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-onyx-500">
        Loading tasks…
      </div>
    );
  }

  const weekend = isWeekend(selectedDate);
  const dateKey = toDateKey(selectedDate);
  const doneCount = completionCountForDateFull(
    selectedDate,
    completions,
    customTasks,
    NO_TODOS,
  );
  const totalCount = totalTaskCountForDate(selectedDate, customTasks, NO_TODOS);
  const displayError = error ?? customError;
  const today = new Date();

  return (
    <div className="space-y-6">
      {displayError && (
        <div className="rounded-lg border border-fawn-600/40 bg-fawn-500/10 px-4 py-3 text-sm text-fawn-300">
          {displayError}
        </div>
      )}

      <PendingTasksAlert
        date={today}
        completions={completions}
        customTasks={customTasks}
        todos={todos}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-onyx-50">
            {formatDisplayDate(selectedDate)}
            {isToday(selectedDate) && (
              <span className="ml-2 text-sm font-normal text-sea-400">(Today)</span>
            )}
          </h2>
          <p className="text-sm text-onyx-400">
            {doneCount}/{totalCount} completed
          </p>
        </div>
        <button
          type="button"
          onClick={goToToday}
          className="rounded-lg border border-onyx-700 bg-onyx-800 px-3 py-1.5 text-sm text-onyx-300 hover:border-onyx-600 hover:text-onyx-100"
        >
          Jump to today
        </button>
      </div>

      <TaskCalendar
        centerDate={calendarCenter}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        completions={completions}
        customByDate={customByDate}
      />

      <DailyTasks
        date={selectedDate}
        completions={completions}
        onToggle={toggleDaily}
      />
      <PersonOverview date={selectedDate} />

      {weekend && (
        <WeekendTasks
          date={selectedDate}
          completions={completions}
          onToggle={toggleWeekend}
        />
      )}

      <CustomTasks
        date={selectedDate}
        tasks={customByDate[dateKey] ?? []}
        onToggle={toggleTask}
        onDelete={removeTask}
        onAdd={addTask}
      />

      <div className="rounded-xl border border-pine-800/50 bg-pine-900/20 p-4">
        <h4 className="text-sm font-medium text-pine-300">How tasks work</h4>
        <p className="mt-1 text-xs leading-relaxed text-onyx-400">
          Daily chores rotate automatically. Weekend cleaning is extra on Sat/Sun.
          Add custom tasks for one-off jobs. Use the Todos tab for checklists.
        </p>
      </div>
    </div>
  );
}
