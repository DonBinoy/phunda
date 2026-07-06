"use client";

import { useState } from "react";
import { PEOPLE } from "@/lib/constants";
import { isToday, isTomorrow, personName, toDateKey } from "@/lib/rotation";
import type { CustomTask, PersonId } from "@/lib/types";
import { TaskCard } from "./TaskViews";

interface CustomTasksProps {
  date: Date;
  tasks: CustomTask[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (body: { title: string; personId: PersonId; date: string }) => Promise<unknown>;
}

export function CustomTasks({
  date,
  tasks,
  onToggle,
  onDelete,
  onAdd,
}: CustomTasksProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [personId, setPersonId] = useState<PersonId | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const dateKey = toDateKey(date);
  const dayTasks = tasks;
  const highlight = isToday(date) ? "today" : isTomorrow(date) ? "tomorrow" : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !personId) {
      setFormError("Enter a task name and assign someone");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await onAdd({ title: title.trim(), personId, date: dateKey });
      setTitle("");
      setPersonId("");
      setOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add task");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-onyx-400">
          Custom tasks
        </h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-pine-700/50 bg-pine-900/30 px-3 py-1.5 text-xs font-medium text-pine-300 hover:border-pine-600"
        >
          {open ? "Cancel" : "+ Add task"}
        </button>
      </div>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-onyx-800 bg-onyx-900 p-4 space-y-3"
        >
          {formError && (
            <p className="text-sm text-fawn-400">{formError}</p>
          )}
          <div>
            <label className="mb-1 block text-xs text-onyx-400">Task name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Buy gas, fix tap, etc."
              className="w-full rounded-lg border border-onyx-700 bg-onyx-950 px-3 py-2.5 text-onyx-100 placeholder:text-onyx-600 focus:border-sea-500 focus:outline-none focus:ring-1 focus:ring-sea-500/30"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs text-onyx-400">Assign to</label>
            <div className="grid grid-cols-4 gap-2">
              {PEOPLE.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => setPersonId(person.id)}
                  className={`rounded-lg border py-2 text-sm font-medium transition-colors ${
                    personId === person.id
                      ? "border-sea-500/50 bg-sea-500/10 text-sea-400"
                      : "border-onyx-700 text-onyx-400 hover:border-onyx-600"
                  }`}
                >
                  {person.name}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-sea-500 py-2 text-sm font-semibold text-onyx-950 hover:bg-sea-400 disabled:opacity-50"
          >
            {submitting ? "Adding…" : "Add custom task"}
          </button>
        </form>
      )}

      {dayTasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-onyx-800 py-6 text-center text-sm text-onyx-500">
          No custom tasks for this day.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {dayTasks.map((task) => (
            <div key={task.id} className="relative group/card">
              <TaskCard
                title={task.title}
                assignee={personName(task.personId)}
                completed={task.completed}
                onToggle={() => onToggle(task.id)}
                highlight={highlight}
              />
              <button
                type="button"
                onClick={() => onDelete(task.id)}
                className="absolute right-3 top-3 rounded-md p-1 text-onyx-600 opacity-0 transition-opacity hover:text-fawn-400 group-hover/card:opacity-100"
                aria-label="Delete task"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
