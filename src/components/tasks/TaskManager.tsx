"use client";

import { useMemo, useState } from "react";
import { useCustomTasks } from "@/hooks/useCustomTasks";
import { useCompletions } from "@/hooks/useCompletions";
import { useOutsideEating } from "@/hooks/useOutsideEating";
import { useTodos } from "@/hooks/useTodos";
import { usePersonSession } from "@/context/PersonSessionContext";
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
import {
  DailyTasks,
  PersonOverview,
  TaskCalendar,
  WeekendTasks,
} from "./TaskViews";

export function TaskManager() {
  const { viewScope, isAdmin } = usePersonSession();
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
  );
  const totalCount = totalTaskCountForDate(
    selectedDate,
    customTasks,
    todos,
    outsideEatingDays,
    viewScope,
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
