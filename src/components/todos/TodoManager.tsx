"use client";

import { useState } from "react";
import { useTodos } from "@/hooks/useTodos";
import { formatDisplayDate, formatWeekdayShort, isToday, toDateKey } from "@/lib/rotation";
import { todoStats } from "@/lib/tasks";
import type { TodoList } from "@/lib/types";
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
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calendarCenter, setCalendarCenter] = useState(() => new Date());
  const {
    byDate: todosByDate,
    loading,
    error,
    addTodo,
    toggleItem,
    removeTodo,
  } = useTodos(calendarCenter);

  const goToToday = () => {
    const now = new Date();
    setSelectedDate(now);
    setCalendarCenter(now);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-onyx-500">
        Loading todos…
      </div>
    );
  }

  const dateKey = toDateKey(selectedDate);
  const stats = todoStats(todosByDate[dateKey] ?? []);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-fawn-600/40 bg-fawn-500/10 px-4 py-3 text-sm text-fawn-300">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-onyx-50">
            {formatDisplayDate(selectedDate)}
            {isToday(selectedDate) && (
              <span className="ml-2 text-sm font-normal text-sea-400">(Today)</span>
            )}
          </h2>
          <p className="text-sm text-onyx-400">
            {stats.total > 0
              ? `${stats.done}/${stats.total} items completed`
              : "No todo items for this day"}
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

      <TodoCalendar
        centerDate={calendarCenter}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        todosByDate={todosByDate}
      />

      <Todos
        date={selectedDate}
        lists={todosByDate[dateKey] ?? []}
        onToggleItem={toggleItem}
        onDelete={removeTodo}
        onAdd={addTodo}
      />
    </div>
  );
}
