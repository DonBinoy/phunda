"use client";

import { useMemo, useState } from "react";
import { useTodos } from "@/hooks/useTodos";
import { usePersonSession } from "@/context/PersonSessionContext";
import { Alert } from "@/components/ui/Alert";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { filterTodos } from "@/lib/personalize";
import { formatDisplayDate, formatWeekdayShort, isToday, toDateKey } from "@/lib/rotation";
import { todoStats } from "@/lib/tasks";
import type { TodoList, ViewScope } from "@/lib/types";
import { Todos } from "../tasks/Todos";

function TodoCalendar({
  centerDate,
  selectedDate,
  onSelectDate,
  todosByDate,
}: {
  centerDate: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  todosByDate: Record<string, TodoList[]>;
}) {
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
          const stats = todoStats(todosByDate[key] ?? []);
          const allDone = stats.total > 0 && stats.done === stats.total;

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
                {formatWeekdayShort(date)}
              </span>
              <span
                className={`text-sm font-semibold ${today ? "text-fawn-400" : "text-onyx-200"}`}
              >
                {date.getDate()}
              </span>
              {stats.total === 0 ? (
                <span className="mt-0.5 text-[10px] text-onyx-600">—</span>
              ) : allDone ? (
                <span className="mt-0.5 text-[10px] text-sea-500">✓</span>
              ) : (
                <span className="mt-0.5 text-[10px] text-onyx-500">
                  {stats.done}/{stats.total}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TodoManager() {
  const { viewScope } = usePersonSession();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calendarCenter, setCalendarCenter] = useState(() => new Date());
  const {
    byDate: todosByDateRaw,
    loading,
    error,
    addTodo,
    toggleItem,
    removeTodo,
  } = useTodos(calendarCenter);

  const todosByDate = useMemo(() => {
    const filtered = filterTodos(
      Object.values(todosByDateRaw).flat(),
      viewScope,
    );
    const map: Record<string, TodoList[]> = {};
    for (const todo of filtered) {
      if (!map[todo.date]) map[todo.date] = [];
      map[todo.date].push(todo);
    }
    return map;
  }, [todosByDateRaw, viewScope]);

  const goToToday = () => {
    const now = new Date();
    setSelectedDate(now);
    setCalendarCenter(now);
  };

  if (!viewScope || loading) {
    return <LoadingState label="Loading todos…" />;
  }

  const dateKey = toDateKey(selectedDate);
  const stats = todoStats(todosByDate[dateKey] ?? []);

  return (
    <div className="space-y-5">
      {error && <Alert>{error}</Alert>}

      <PageHeader
        title={formatDisplayDate(selectedDate)}
        badge={isToday(selectedDate) ? "Today" : undefined}
        subtitle={
          stats.total > 0
            ? `${stats.done}/${stats.total} items completed`
            : viewScope.isAdmin
              ? "No todo items for this day"
              : "No todo items for you on this day"
        }
        progress={
          stats.total > 0
            ? { done: stats.done, total: stats.total }
            : undefined
        }
        action={
          <button type="button" onClick={goToToday} className="btn-ghost shrink-0">
            Jump to today
          </button>
        }
      />

      <div className="glass-card p-5">
        <TodoCalendar
        centerDate={calendarCenter}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        todosByDate={todosByDate}
      />
      </div>

      <Todos
        date={selectedDate}
        lists={todosByDate[dateKey] ?? []}
        viewScope={viewScope}
        onToggleItem={toggleItem}
        onDelete={removeTodo}
        onAdd={addTodo}
      />
    </div>
  );
}
