"use client";

import { useEffect, useState } from "react";
import { getPendingTasks } from "@/lib/tasks";
import { toDateKey } from "@/lib/rotation";
import type { CompletionsStore, CustomTask, PendingTaskItem, TodoList, ViewScope } from "@/lib/types";

interface PendingTasksAlertProps {
  date: Date;
  completions: CompletionsStore;
  customTasks: CustomTask[];
  todos: TodoList[];
  outsideEatingDays?: ReadonlySet<string>;
  viewScope: ViewScope;
}

const DISMISS_KEY = "phunda-pending-dismissed";

export function PendingTasksAlert({
  date,
  completions,
  customTasks,
  todos,
  outsideEatingDays = new Set(),
  viewScope,
}: PendingTasksAlertProps) {
  const [dismissed, setDismissed] = useState(true);
  const pending = getPendingTasks(
    date,
    completions,
    customTasks,
    todos,
    outsideEatingDays,
    viewScope,
  );

  useEffect(() => {
    const key = `${DISMISS_KEY}-${toDateKey(date)}`;
    setDismissed(sessionStorage.getItem(key) === "1");
  }, [date]);

  if (pending.length === 0 || dismissed) return null;

  const dismiss = () => {
    const key = `${DISMISS_KEY}-${toDateKey(date)}`;
    sessionStorage.setItem(key, "1");
    setDismissed(true);
  };

  const kindLabel: Record<PendingTaskItem["kind"], string> = {
    daily: "Daily",
    weekend: "Weekend",
    custom: "Custom",
    todo: "Todo",
  };

  return (
    <div className="glass-card overflow-hidden border-fawn-500/25 bg-gradient-to-br from-fawn-500/10 to-transparent p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-fawn-500/20 text-fawn-400 ring-1 ring-fawn-500/30">
            !
          </div>
          <div>
            <h3 className="font-semibold text-fawn-200">
              {viewScope.isAdmin
                ? `${pending.length} pending today`
                : `${pending.length} on your list`}
            </h3>
            <p className="mt-0.5 text-xs text-fawn-400/70">
              Complete before the day ends
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="btn-ghost shrink-0 py-1 text-xs"
        >
          Dismiss
        </button>
      </div>
      <ul className="mt-4 max-h-44 space-y-1.5 overflow-y-auto">
        {pending.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-2 rounded-xl border border-onyx-800/60 bg-onyx-950/50 px-3 py-2.5 text-sm backdrop-blur-sm"
          >
            <span className="min-w-0 truncate text-onyx-100">{item.label}</span>
            <span className="shrink-0 text-xs text-onyx-500">
              <span className="text-pine-400">{kindLabel[item.kind]}</span>
              {item.assignee && ` · ${item.assignee}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
