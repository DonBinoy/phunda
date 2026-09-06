"use client";

import { useMemo, useState } from "react";
import { useCustomTasks } from "@/hooks/useCustomTasks";
import { useCompletions } from "@/hooks/useCompletions";
import { useOutsideEating } from "@/hooks/useOutsideEating";
import { useTodos } from "@/hooks/useTodos";
import { usePersonSession } from "@/context/PersonSessionContext";
import { useHouseholdConfig } from "@/context/HouseholdConfigContext";
import { Alert } from "@/components/ui/Alert";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  completionCountForDateFull,
  totalTaskCountForDate,
} from "@/lib/tasks";
import { filterCustomTasks, filterTodos } from "@/lib/personalize";
import {
  formatDisplayDate,
  isToday,
  isWeekend,
  toDateKey,
} from "@/lib/rotation";
import { CustomTasks } from "./CustomTasks";
import { OutsideEatingCalendar } from "./OutsideEatingCalendar";
import { PendingTasksAlert } from "./PendingTasksAlert";
import { GauntletWidget } from "./GauntletWidget";
import { WheelOfMisfortune } from "./WheelOfMisfortune";
import type { AppTab } from "@/components/TabNav";
import {
  DailyTasks,
  PersonOverview,
  TaskCalendar,
  WeekendTasks,
} from "./TaskViews";

interface TaskManagerProps {
  onNavigateTab?: (tab: AppTab) => void;
}

export function TaskManager({ onNavigateTab }: TaskManagerProps = {}) {
  const { viewScope, isAdmin } = usePersonSession();
  const { config } = useHouseholdConfig();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calendarCenter, setCalendarCenter] = useState(() => new Date());
  const { completions, loading, error, toggleDaily, toggleWeekend } =
    useCompletions(calendarCenter);
  const {
    outsideEatingDays,
    loading: outsideLoading,
    error: outsideError,
    toggleDay: toggleOutsideEating,
  } = useOutsideEating(calendarCenter);
  const {
    tasks: customTasksRaw,
    loading: customLoading,
    error: customError,
    addTask,
    toggleTask,
    removeTask,
  } = useCustomTasks(calendarCenter);
  const { todos: todosRaw, loading: todosLoading } = useTodos(calendarCenter);

  const customTasks = useMemo(
    () => filterCustomTasks(customTasksRaw, viewScope),
    [customTasksRaw, viewScope],
  );
  const customByDate = useMemo(() => {
    const map: Record<string, typeof customTasks> = {};
    for (const task of customTasks) {
      if (!map[task.date]) map[task.date] = [];
      map[task.date].push(task);
    }
    return map;
  }, [customTasks]);
  const todos = useMemo(
    () => filterTodos(todosRaw, viewScope),
    [todosRaw, viewScope],
  );

  const goToToday = () => {
    const now = new Date();
    setSelectedDate(now);
    setCalendarCenter(now);
  };

  if (!viewScope || loading || customLoading || todosLoading || outsideLoading) {
    return <LoadingState label="Loading tasks…" />;
  }

  const weekend = isWeekend(selectedDate);
  const dateKey = toDateKey(selectedDate);
  const doneCount = completionCountForDateFull(
    selectedDate,
    completions,
    customTasks,
    todos,
    outsideEatingDays,
    viewScope,
    config,
  );
  const totalCount = totalTaskCountForDate(
    selectedDate,
    customTasks,
    todos,
    outsideEatingDays,
    viewScope,
    config,
  );
  const displayError = error ?? customError ?? outsideError;
  const today = new Date();

  return (
    <div className="space-y-5">
      {displayError && <Alert>{displayError}</Alert>}

      <PendingTasksAlert
        date={today}
        completions={completions}
        customTasks={customTasks}
        todos={todos}
        outsideEatingDays={outsideEatingDays}
        viewScope={viewScope}
      />
      
      <GauntletWidget />

      {isAdmin && (
        <div className="flex flex-col gap-3 rounded-2xl border border-fawn-500/30 bg-gradient-to-r from-fawn-500/15 via-onyx-900/60 to-onyx-950/80 p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fawn-500/20 text-xl ring-1 ring-fawn-500/40">
              👑
            </span>
            <div>
              <p className="text-sm font-bold text-fawn-200">Admin Control Center</p>
              <p className="text-xs text-onyx-400">
                Only admins can add household members and create new daily chores.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab?.("admin")}
              className="rounded-xl bg-sea-500 px-3.5 py-2 text-xs font-bold text-onyx-950 shadow-sm transition hover:bg-sea-400"
            >
              + Add New Person
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab?.("admin")}
              className="rounded-xl bg-fawn-500 px-3.5 py-2 text-xs font-bold text-onyx-950 shadow-sm transition hover:bg-fawn-400"
            >
              + Add Daily Chore
            </button>
          </div>
        </div>
      )}

      <PageHeader
        title={formatDisplayDate(selectedDate)}
        badge={isToday(selectedDate) ? "Today" : undefined}
        subtitle={
          totalCount > 0
            ? `${doneCount} of ${totalCount} tasks completed`
            : "No tasks scheduled"
        }
        progress={{ done: doneCount, total: totalCount }}
        action={
          <button type="button" onClick={goToToday} className="btn-ghost shrink-0">
            Jump to today
          </button>
        }
      />

      <TaskCalendar
        centerDate={calendarCenter}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        completions={completions}
        customByDate={customByDate}
        outsideEatingDays={outsideEatingDays}
        viewScope={viewScope}
      />

      {isAdmin && (
        <OutsideEatingCalendar
          outsideEatingDays={outsideEatingDays}
          onToggle={toggleOutsideEating}
          selectedDate={selectedDate}
          onSelectDate={(date) => {
            setSelectedDate(date);
            setCalendarCenter(date);
          }}
        />
      )}

      <div
        className={`grid gap-5 ${isAdmin ? "lg:grid-cols-2" : ""}`}
      >
        <div className="space-y-5">
          <DailyTasks
            date={selectedDate}
            completions={completions}
            outsideEatingDays={outsideEatingDays}
            viewScope={viewScope}
            onToggle={toggleDaily}
            onToggleOutsideEating={toggleOutsideEating}
            onAddDailyChore={() => onNavigateTab?.("admin")}
          />
          {weekend && (
            <div className="space-y-5">
              <WheelOfMisfortune date={selectedDate} />
              <WeekendTasks
                date={selectedDate}
                completions={completions}
                viewScope={viewScope}
                onToggle={toggleWeekend}
              />
            </div>
          )}
        </div>

        {isAdmin && (
          <PersonOverview
            date={selectedDate}
            outsideEatingDays={outsideEatingDays}
            viewScope={viewScope}
          />
        )}
      </div>

      <CustomTasks
        date={selectedDate}
        tasks={customByDate[dateKey] ?? []}
        viewScope={viewScope}
        onToggle={toggleTask}
        onDelete={removeTask}
        onAdd={addTask}
      />

      {isAdmin && (
        <div className="glass-card border-pine-800/30 bg-gradient-to-br from-pine-900/20 to-transparent p-5">
          <h4 className="text-sm font-medium text-pine-300">How it works</h4>
          <p className="mt-1.5 text-xs leading-relaxed text-onyx-400">
            Daily chores rotate automatically. Use the ate-outside calendar to
            mark any day — cooking chores move to the next day. Weekend kitchen
            alternates between Don &amp; Suraj and Adithyan &amp; Bijo.
          </p>
        </div>
      )}
    </div>
  );
}
