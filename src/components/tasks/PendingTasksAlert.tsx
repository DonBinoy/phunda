"use client";

import { useEffect, useState } from "react";
import { getPendingTasks } from "@/lib/tasks";
import { toDateKey } from "@/lib/rotation";
import type { CompletionsStore, CustomTask, PendingTaskItem, TodoList } from "@/lib/types";

interface PendingTasksAlertProps {
  date: Date;
  completions: CompletionsStore;
  customTasks: CustomTask[];
  todos: TodoList[];
}

const DISMISS_KEY = "phunda-pending-dismissed";

export function PendingTasksAlert({
  date,
  completions,
  customTasks,
  todos,
}: PendingTasksAlertProps) {
  const [dismissed, setDismissed] = useState(true);
  const pending = getPendingTasks(date, completions, customTasks, todos);

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
    <div className="rounded-xl border border-fawn-500/40 bg-fawn-500/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-fawn-300">
            {pending.length} task{pending.length === 1 ? "" : "s"} still pending today
          </h3>
          <p className="mt-0.5 text-xs text-fawn-400/80">
            Complete these before the day ends
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 text-xs text-onyx-400 hover:text-onyx-200"
        >
          Dismiss
        </button>
      </div>
      <ul className="mt-3 max-h-48 space-y-1.5 overflow-y-auto">
        {pending.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-2 rounded-lg bg-onyx-950/40 px-3 py-2 text-sm"
          >
            <span className="min-w-0 truncate text-onyx-100">{item.label}</span>
            <span className="shrink-0 text-xs text-onyx-500">
              <span className="text-pine-500">{kindLabel[item.kind]}</span>
              {item.assignee && ` · ${item.assignee}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
