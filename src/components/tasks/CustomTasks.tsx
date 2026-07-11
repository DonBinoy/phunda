"use client";

import { useState } from "react";
import { PEOPLE } from "@/lib/constants";
import { isToday, isTomorrow, personName, toDateKey } from "@/lib/rotation";
import { Section } from "@/components/ui/Section";
import type { CustomTask, PersonId, ViewScope } from "@/lib/types";
import { lockedPersonId } from "@/lib/personalize";

interface CustomTasksProps {
  date: Date;
  tasks: CustomTask[];
  viewScope: ViewScope;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (body: { title: string; personId: PersonId; date: string }) => Promise<unknown>;
}

function CustomTaskCard({
  title,
  assignee,
  completed,
  highlight,
  onToggle,
  onDelete,
}: {
  title: string;
  assignee: string;
  completed: boolean;
  highlight?: "today" | "tomorrow";
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`flex overflow-hidden rounded-xl border transition-all ${
        completed
          ? "border-sea-700/50 bg-sea-900/20 opacity-75"
          : highlight === "today"
            ? "border-sea-500/50 bg-sea-500/5"
            : highlight === "tomorrow"
              ? "border-fawn-500/40 bg-fawn-500/5"
              : "border-onyx-700 bg-onyx-900"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex min-w-0 flex-1 items-start gap-3 p-4 text-left hover:bg-onyx-800/40"
      >
        <div
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
            completed
              ? "border-sea-500 bg-sea-500 text-onyx-950"
              : "border-onyx-600"
          }`}
        >
          {completed && (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`font-medium ${completed ? "text-onyx-400 line-through" : "text-onyx-100"}`}
          >
            {title}
          </p>
          <p className="mt-1 text-sm text-pine-400">{assignee}</p>
        </div>
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="flex shrink-0 items-center border-l border-onyx-800 px-3 text-onyx-600 hover:bg-fawn-500/10 hover:text-fawn-400"
        aria-label="Delete task"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}

export function CustomTasks({
  date,
  tasks,
  viewScope,
  onToggle,
  onDelete,
  onAdd,
}: CustomTasksProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [personId, setPersonId] = useState<PersonId | "">(
    () => lockedPersonId(viewScope) ?? "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const dateKey = toDateKey(date);
  const highlight = isToday(date) ? "today" : isTomorrow(date) ? "tomorrow" : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const assignee = lockedPersonId(viewScope) ?? personId;
    if (!title.trim() || !assignee) {
      setFormError("Enter a task name and assign someone");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await onAdd({ title: title.trim(), personId: assignee, date: dateKey });
      setTitle("");
      if (viewScope.isAdmin) setPersonId("");
      setOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add task");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section
      title={viewScope.isAdmin ? "Custom tasks" : "Your custom tasks"}
      action={
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="chip border border-pine-700/50 bg-pine-900/40 text-pine-300 hover:bg-pine-900/60"
        >
          {open ? "Cancel" : "+ Add task"}
        </button>
      }
    >

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
            {viewScope.isAdmin ? (
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
            ) : (
              <p className="rounded-lg border border-onyx-700 bg-onyx-950 px-3 py-2 text-sm text-pine-400">
                {personName(viewScope.personId)}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full disabled:opacity-50"
          >
            {submitting ? "Adding…" : "Add custom task"}
          </button>
        </form>
      )}

      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-onyx-800 py-6 text-center text-sm text-onyx-500">
          {viewScope.isAdmin
            ? "No custom tasks for this day."
            : "No custom tasks for you on this day."}
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {tasks.map((task) => (
            <CustomTaskCard
              key={task.id}
              title={task.title}
              assignee={personName(task.personId)}
              completed={task.completed}
              highlight={highlight}
              onToggle={() => onToggle(task.id)}
              onDelete={() => onDelete(task.id)}
            />
          ))}
        </div>
      )}
    </Section>
  );
}
