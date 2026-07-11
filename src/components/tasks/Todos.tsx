"use client";

import { useState } from "react";
import { PEOPLE } from "@/lib/constants";
import { isToday, isTomorrow, personName, toDateKey } from "@/lib/rotation";
import { Section } from "@/components/ui/Section";
import type { PersonId, TodoList, ViewScope } from "@/lib/types";
import { lockedPersonId } from "@/lib/personalize";

interface TodosProps {
  date: Date;
  lists: TodoList[];
  viewScope: ViewScope;
  onToggleItem: (listId: string, itemId: string) => void;
  onDelete: (id: string) => void;
  onAdd: (body: {
    title: string;
    personId: PersonId;
    date: string;
    items: string[];
  }) => Promise<unknown>;
}

export function Todos({
  date,
  lists,
  viewScope,
  onToggleItem,
  onDelete,
  onAdd,
}: TodosProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [personId, setPersonId] = useState<PersonId | "">(
    () => lockedPersonId(viewScope) ?? "",
  );
  const [itemsText, setItemsText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const dateKey = toDateKey(date);
  const dayLists = lists;
  const highlight = isToday(date) ? "today" : isTomorrow(date) ? "tomorrow" : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = itemsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const assignee = lockedPersonId(viewScope) ?? personId;

    if (!title.trim() || !assignee || items.length === 0) {
      setFormError("Enter a title, assign someone, and at least one item");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await onAdd({
        title: title.trim(),
        personId: assignee,
        date: dateKey,
        items,
      });
      setTitle("");
      if (viewScope.isAdmin) setPersonId("");
      setItemsText("");
      setOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create todo");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section
      title={viewScope.isAdmin ? "Todo lists" : "Your todo lists"}
      action={
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="chip border border-pine-700/50 bg-pine-900/40 text-pine-300 hover:bg-pine-900/60"
        >
          {open ? "Cancel" : "+ New todo"}
        </button>
      }
    >

      {open && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-onyx-800 bg-onyx-900 p-4 space-y-3"
        >
          {formError && <p className="text-sm text-fawn-400">{formError}</p>}
          <div>
            <label className="mb-1 block text-xs text-onyx-400">Todo title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Grocery run, Room setup, etc."
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
          <div>
            <label className="mb-1 block text-xs text-onyx-400">
              Items (one per line)
            </label>
            <textarea
              value={itemsText}
              onChange={(e) => setItemsText(e.target.value)}
              rows={4}
              placeholder={"Milk\nBread\nEggs"}
              className="w-full rounded-lg border border-onyx-700 bg-onyx-950 px-3 py-2.5 text-onyx-100 placeholder:text-onyx-600 focus:border-sea-500 focus:outline-none focus:ring-1 focus:ring-sea-500/30 resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create todo list"}
          </button>
        </form>
      )}

      {dayLists.length === 0 ? (
        <p className="rounded-xl border border-dashed border-onyx-800 py-6 text-center text-sm text-onyx-500">
          {viewScope.isAdmin
            ? "No todo lists for this day."
            : "No todo lists for you on this day."}
        </p>
      ) : (
        <div className="space-y-3">
          {dayLists.map((list) => {
            const done = list.items.filter((i) => i.completed).length;
            const total = list.items.length;
            const allDone = total > 0 && done === total;

            return (
              <div
                key={list.id}
                className={`rounded-xl border p-4 ${
                  allDone
                    ? "border-sea-700/40 bg-sea-900/10"
                    : highlight === "today"
                      ? "border-sea-500/30 bg-sea-500/5"
                      : "border-onyx-800 bg-onyx-900"
                }`}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <h4
                      className={`font-medium ${allDone ? "text-onyx-400 line-through" : "text-onyx-100"}`}
                    >
                      {list.title}
                    </h4>
                    <p className="text-xs text-pine-400">
                      {personName(list.personId)} · {done}/{total} done
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDelete(list.id)}
                    className="text-onyx-600 hover:text-fawn-400"
                    aria-label="Delete todo list"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <ul className="space-y-1.5">
                  {list.items.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => onToggleItem(list.id, item.id)}
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-onyx-800/60"
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                            item.completed
                              ? "border-sea-500 bg-sea-500 text-onyx-950"
                              : "border-onyx-600"
                          }`}
                        >
                          {item.completed && (
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <span
                          className={`text-sm ${item.completed ? "text-onyx-500 line-through" : "text-onyx-200"}`}
                        >
                          {item.title}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}
