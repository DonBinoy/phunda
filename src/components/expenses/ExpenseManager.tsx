"use client";

import { useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { PEOPLE } from "@/lib/constants";
import { personName } from "@/lib/rotation";
import type { PersonId } from "@/lib/types";

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ExpenseManager() {
  const { entries, totals, loading, error, addEntry, removeEntry } =
    useExpenses();
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [personId, setPersonId] = useState<PersonId | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0 || !comment.trim()) return;
    if (type === "income" && !personId) {
      setFormError("Select who received this income");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await addEntry({
        type,
        amount: parsed,
        comment: comment.trim(),
        personId: personId || undefined,
      });
      setAmount("");
      setComment("");
      if (type === "income") setPersonId("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add entry");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeEntry(id);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to delete entry");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-onyx-500">
        Loading expenses…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(error || formError) && (
        <div className="rounded-lg border border-fawn-600/40 bg-fawn-500/10 px-4 py-3 text-sm text-fawn-300">
          {error ?? formError}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-onyx-800 bg-onyx-900 p-4">
          <p className="text-xs uppercase tracking-wider text-onyx-500">
            Total expense
          </p>
          <p className="mt-1 text-2xl font-bold text-fawn-400">
            {formatINR(totals.expense)}
          </p>
        </div>
        <div className="rounded-xl border border-onyx-800 bg-onyx-900 p-4">
          <p className="text-xs uppercase tracking-wider text-onyx-500">
            Total income
          </p>
          <p className="mt-1 text-2xl font-bold text-sea-400">
            {formatINR(totals.income)}
          </p>
        </div>
        <div className="rounded-xl border border-pine-800/50 bg-pine-900/30 p-4">
          <p className="text-xs uppercase tracking-wider text-onyx-500">
            Balance
          </p>
          <p
            className={`mt-1 text-2xl font-bold ${
              totals.balance >= 0 ? "text-sea-400" : "text-fawn-400"
            }`}
          >
            {formatINR(totals.balance)}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-onyx-400">
          By person
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {PEOPLE.map((person) => {
            const stats = totals.byPerson[person.id];
            return (
              <div
                key={person.id}
                className="rounded-xl border border-onyx-800 bg-onyx-900/60 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pine-800 text-sm font-bold text-pine-200">
                    {person.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-onyx-100">{person.name}</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                      <span className="text-sea-400">
                        +{formatINR(stats.income)}
                      </span>
                      <span className="text-fawn-400">
                        −{formatINR(stats.expense)}
                      </span>
                      <span
                        className={
                          stats.balance >= 0 ? "text-pine-300" : "text-fawn-300"
                        }
                      >
                        = {formatINR(stats.balance)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-onyx-800 bg-onyx-900 p-4 space-y-4"
      >
        <h3 className="font-medium text-onyx-100">Add entry</h3>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
              type === "expense"
                ? "border-fawn-500/50 bg-fawn-500/10 text-fawn-400"
                : "border-onyx-700 text-onyx-400 hover:border-onyx-600"
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
              type === "income"
                ? "border-sea-500/50 bg-sea-500/10 text-sea-400"
                : "border-onyx-700 text-onyx-400 hover:border-onyx-600"
            }`}
          >
            Income
          </button>
        </div>

        <div>
          <label className="mb-2 block text-xs text-onyx-400">
            {type === "income" ? "Who received this?" : "Paid by (optional)"}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {PEOPLE.map((person) => (
              <button
                key={person.id}
                type="button"
                onClick={() =>
                  setPersonId((prev) =>
                    prev === person.id ? "" : person.id,
                  )
                }
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
          {type === "income" && !personId && (
            <p className="mt-1.5 text-xs text-onyx-500">
              Required for income entries
            </p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-onyx-400">
              Amount (₹)
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500"
              className="w-full rounded-lg border border-onyx-700 bg-onyx-950 px-3 py-2.5 text-onyx-100 placeholder:text-onyx-600 focus:border-sea-500 focus:outline-none focus:ring-1 focus:ring-sea-500/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-onyx-400">Comment</label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={type === "income" ? "Salary, contribution, etc." : "Groceries, rent, etc."}
              className="w-full rounded-lg border border-onyx-700 bg-onyx-950 px-3 py-2.5 text-onyx-100 placeholder:text-onyx-600 focus:border-sea-500 focus:outline-none focus:ring-1 focus:ring-sea-500/30"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-sea-500 py-2.5 text-sm font-semibold text-onyx-950 hover:bg-sea-400 transition-colors disabled:opacity-50"
        >
          {submitting ? "Saving…" : `Add ${type === "expense" ? "expense" : "income"}`}
        </button>
      </form>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-onyx-400">
          History
        </h3>
        {entries.length === 0 ? (
          <p className="rounded-xl border border-dashed border-onyx-800 py-10 text-center text-sm text-onyx-500">
            No entries yet. Add your first expense or income above.
          </p>
        ) : (
          <ul className="space-y-2">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-onyx-800 bg-onyx-900 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-onyx-100 truncate">
                    {entry.comment}
                  </p>
                  <p className="text-xs text-onyx-500">
                    {entry.personId && (
                      <span className="text-pine-400">
                        {personName(entry.personId)}
                        {" · "}
                      </span>
                    )}
                    {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`font-semibold ${
                      entry.type === "expense" ? "text-fawn-400" : "text-sea-400"
                    }`}
                  >
                    {entry.type === "expense" ? "−" : "+"}
                    {formatINR(entry.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(entry.id)}
                    className="text-onyx-600 hover:text-onyx-400 transition-colors"
                    aria-label="Remove entry"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
