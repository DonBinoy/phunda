"use client";

import { useMemo, useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { PEOPLE } from "@/lib/constants";
import type { ExpenseEntry, PersonId } from "@/lib/types";

type ExpenseTab = PersonId | "total";

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EntryCard({
  entry,
  onRemove,
}: {
  entry: ExpenseEntry;
  onRemove: (id: string) => void;
}) {
  const isExpense = entry.type === "expense";

  return (
    <div
      className={`rounded-xl border p-4 ${
        isExpense
          ? "border-fawn-500/20 bg-fawn-500/5"
          : "border-sea-500/20 bg-sea-500/5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              isExpense
                ? "bg-fawn-500/20 text-fawn-400"
                : "bg-sea-500/20 text-sea-400"
            }`}
          >
            {isExpense ? "Expense" : "Income"}
          </span>
          <p className="mt-2 font-medium text-onyx-100">{entry.comment}</p>
          <p className="mt-1 text-xs text-onyx-500">{formatDate(entry.createdAt)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`text-lg font-bold ${
              isExpense ? "text-fawn-400" : "text-sea-400"
            }`}
          >
            {isExpense ? "−" : "+"}
            {formatINR(entry.amount)}
          </span>
          <button
            type="button"
            onClick={() => onRemove(entry.id)}
            className="text-xs text-onyx-600 hover:text-fawn-400"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function PersonRecords({
  personName,
  income,
  expense,
  stats,
  onRemove,
}: {
  personName: string;
  income: ExpenseEntry[];
  expense: ExpenseEntry[];
  stats: { income: number; expense: number; balance: number };
  onRemove: (id: string) => void;
}) {
  if (income.length === 0 && expense.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-onyx-800 py-10 text-center text-sm text-onyx-500">
        No records for {personName} yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-sea-500/20 bg-sea-500/5 p-3">
          <p className="text-xs text-onyx-500">Income</p>
          <p className="text-lg font-bold text-sea-400">{formatINR(stats.income)}</p>
        </div>
        <div className="rounded-xl border border-fawn-500/20 bg-fawn-500/5 p-3">
          <p className="text-xs text-onyx-500">Expense</p>
          <p className="text-lg font-bold text-fawn-400">{formatINR(stats.expense)}</p>
        </div>
        <div className="rounded-xl border border-onyx-800 bg-onyx-900 p-3">
          <p className="text-xs text-onyx-500">Balance</p>
          <p
            className={`text-lg font-bold ${
              stats.balance >= 0 ? "text-sea-400" : "text-fawn-400"
            }`}
          >
            {formatINR(stats.balance)}
          </p>
        </div>
      </div>

      {income.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-sea-500">
            Income
          </p>
          {income.map((e) => (
            <EntryCard key={e.id} entry={e} onRemove={onRemove} />
          ))}
        </section>
      )}

      {expense.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-fawn-500">
            Expenses
          </p>
          {expense.map((e) => (
            <EntryCard key={e.id} entry={e} onRemove={onRemove} />
          ))}
        </section>
      )}
    </div>
  );
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
  const [activeTab, setActiveTab] = useState<ExpenseTab>("total");

  const byPerson = useMemo(() => {
    return PEOPLE.map((person) => ({
      person,
      income: entries.filter((e) => e.type === "income" && e.personId === person.id),
      expense: entries.filter((e) => e.type === "expense" && e.personId === person.id),
      stats: totals.byPerson[person.id],
    }));
  }, [entries, totals.byPerson]);

  const unassignedExpense = useMemo(
    () => entries.filter((e) => e.type === "expense" && !e.personId),
    [entries],
  );

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

  const activePerson =
    activeTab !== "total"
      ? byPerson.find((p) => p.person.id === activeTab)
      : null;

  return (
    <div className="space-y-6">
      {(error || formError) && (
        <div className="rounded-lg border border-fawn-600/40 bg-fawn-500/10 px-4 py-3 text-sm text-fawn-300">
          {error ?? formError}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {PEOPLE.map((person) => (
          <button
            key={person.id}
            type="button"
            onClick={() => setActiveTab(person.id)}
            className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === person.id
                ? "border-sea-500/50 bg-sea-500/10 text-sea-400"
                : "border-onyx-800 bg-onyx-900 text-onyx-400 hover:border-onyx-700"
            }`}
          >
            {person.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setActiveTab("total")}
          className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "total"
              ? "border-fawn-500/50 bg-fawn-500/10 text-fawn-400"
              : "border-onyx-800 bg-onyx-900 text-onyx-400 hover:border-onyx-700"
          }`}
        >
          Total
        </button>
      </div>

      {activeTab === "total" ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-fawn-500/20 bg-fawn-500/5 p-4">
            <p className="text-xs uppercase tracking-wider text-fawn-400/80">
              Total expense
            </p>
            <p className="mt-1 text-2xl font-bold text-fawn-400">
              {formatINR(totals.expense)}
            </p>
          </div>
          <div className="rounded-xl border border-sea-500/20 bg-sea-500/5 p-4">
            <p className="text-xs uppercase tracking-wider text-sea-400/80">
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
      ) : activePerson ? (
        <PersonRecords
          personName={activePerson.person.name}
          income={activePerson.income}
          expense={activePerson.expense}
          stats={activePerson.stats}
          onRemove={handleRemove}
        />
      ) : null}

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
                  setPersonId((prev) => (prev === person.id ? "" : person.id))
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
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-onyx-400">Amount (₹)</label>
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
              placeholder={type === "income" ? "Salary, contribution…" : "Groceries, rent…"}
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

      {activeTab === "total" && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-onyx-400">
            All records
          </h3>
          {entries.length === 0 ? (
            <p className="rounded-xl border border-dashed border-onyx-800 py-10 text-center text-sm text-onyx-500">
              No entries yet.
            </p>
          ) : (
            <div className="space-y-6">
              {byPerson.map(({ person, income, expense }) => {
                if (income.length === 0 && expense.length === 0) return null;
                return (
                  <section key={person.id} className="space-y-2">
                    <p className="text-sm font-medium text-pine-300">{person.name}</p>
                    {[...income, ...expense].map((e) => (
                      <EntryCard key={e.id} entry={e} onRemove={handleRemove} />
                    ))}
                  </section>
                );
              })}
              {unassignedExpense.length > 0 && (
                <section className="space-y-2">
                  <p className="text-sm font-medium text-onyx-400">Unassigned</p>
                  {unassignedExpense.map((e) => (
                    <EntryCard key={e.id} entry={e} onRemove={handleRemove} />
                  ))}
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
