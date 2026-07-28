"use client";

import { useMemo, useState } from "react";
import { Section } from "@/components/ui/Section";
import {
  formatWeekdayShort,
  isToday,
  parseDateKey,
  toDateKey,
} from "@/lib/rotation";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

interface OutsideEatingCalendarProps {
  outsideEatingDays: ReadonlySet<string>;
  onToggle: (dateKey: string) => void;
  onSelectDate?: (date: Date) => void;
  selectedDate?: Date;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

export function OutsideEatingCalendar({
  outsideEatingDays,
  onToggle,
  onSelectDate,
  selectedDate,
}: OutsideEatingCalendarProps) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const cells = useMemo(() => {
    const first = startOfMonth(month);
    const startPad = first.getDay();
    const daysInMonth = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    ).getDate();

    const grid: Array<{ key: string; date: Date | null }> = [];

    for (let i = 0; i < startPad; i++) {
      grid.push({ key: `pad-${i}`, date: null });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      grid.push({ key: toDateKey(date), date });
    }

    while (grid.length % 7 !== 0) {
      grid.push({ key: `pad-end-${grid.length}`, date: null });
    }

    return grid;
  }, [month]);

  const markedCount = useMemo(() => {
    const prefix = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
    let count = 0;
    for (const key of outsideEatingDays) {
      if (key.startsWith(prefix)) count++;
    }
    return count;
  }, [month, outsideEatingDays]);

  const shiftMonth = (delta: number) => {
    setMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1),
    );
  };

  const selectedKey = selectedDate ? toDateKey(selectedDate) : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-label={open ? "Hide ate-outside calendar" : "Show ate-outside calendar"}
          title="Ate outside calendar"
          className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-colors ${
            open
              ? "border-fawn-500/50 bg-fawn-500/15 text-fawn-300 ring-1 ring-fawn-500/30"
              : "border-onyx-700 bg-onyx-800/50 text-onyx-400 hover:border-onyx-600 hover:text-onyx-200"
          }`}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          Calendar
          {outsideEatingDays.size > 0 && (
            <span className="rounded-md bg-fawn-500/20 px-1.5 py-0.5 text-[10px] text-fawn-400">
              {outsideEatingDays.size}
            </span>
          )}
        </button>
        {!open && (
          <span className="text-[11px] text-onyx-600">
            Mark ate outside on any day
          </span>
        )}
      </div>

      {open && (
        <Section
          title="Ate outside"
          subtitle="Tap any day to mark or unmark — chores move forward"
          action={
            <div className="flex items-center gap-2">
              {markedCount > 0 && (
                <span className="chip bg-fawn-500/20 text-fawn-300 ring-1 ring-fawn-500/40">
                  {markedCount} this month
                </span>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-ghost px-2.5 py-1 text-xs"
              >
                Close
              </button>
            </div>
          }
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="btn-ghost px-2.5 py-1.5 text-sm"
              aria-label="Previous month"
            >
              ‹
            </button>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-onyx-100">
                {monthLabel(month)}
              </h4>
              <button
                type="button"
                onClick={() => setMonth(startOfMonth(new Date()))}
                className="text-[11px] font-medium text-sea-400 hover:text-sea-300"
              >
                This month
              </button>
            </div>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="btn-ghost px-2.5 py-1.5 text-sm"
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="pb-1 text-center text-[10px] font-medium uppercase tracking-wide text-onyx-600"
              >
                {label}
              </div>
            ))}

            {cells.map(({ key, date }) => {
              if (!date) {
                return <div key={key} className="aspect-square" />;
              }

              const dateKey = toDateKey(date);
              const ateOutside = outsideEatingDays.has(dateKey);
              const today = isToday(date);
              const selected = selectedKey === dateKey;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onToggle(dateKey);
                    onSelectDate?.(date);
                  }}
                  title={`${formatWeekdayShort(date)} ${date.getDate()} — ${
                    ateOutside ? "Unmark ate outside" : "Mark ate outside"
                  }`}
                  className={`flex aspect-square flex-col items-center justify-center rounded-xl border text-sm transition-all ${
                    ateOutside
                      ? "border-fawn-500/50 bg-fawn-500/20 text-fawn-200 ring-1 ring-fawn-500/30"
                      : selected
                        ? "border-sea-500/50 bg-sea-500/10 text-sea-200"
                        : today
                          ? "border-fawn-500/30 bg-fawn-500/5 text-onyx-100"
                          : "border-onyx-800/80 bg-onyx-900/40 text-onyx-300 hover:border-onyx-600 hover:bg-onyx-800/60"
                  }`}
                >
                  <span
                    className={`font-semibold ${
                      today && !ateOutside ? "text-fawn-400" : ""
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {ateOutside && (
                    <span className="text-[9px] font-medium leading-none text-fawn-400">
                      out
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {outsideEatingDays.size > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-onyx-800/80 pt-3">
              {[...outsideEatingDays]
                .sort()
                .slice(-8)
                .reverse()
                .map((key) => {
                  const d = parseDateKey(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        onToggle(key);
                        onSelectDate?.(d);
                      }}
                      className="chip bg-fawn-500/15 text-fawn-300 ring-1 ring-fawn-500/30 hover:bg-fawn-500/25"
                    >
                      {d.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      ×
                    </button>
                  );
                })}
            </div>
          )}
        </Section>
      )}
    </div>
  );
}
