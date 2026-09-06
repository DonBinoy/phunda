"use client";

import { useEffect, useMemo, useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { useHouseholdConfig } from "@/context/HouseholdConfigContext";
import { usePersonSession } from "@/context/PersonSessionContext";
import { Alert } from "@/components/ui/Alert";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { ExpenseRecap } from "@/components/expenses/ExpenseRecap";
import { ExpenseTemplates } from "@/components/expenses/ExpenseTemplates";
import { filterExpenses, lockedPersonId } from "@/lib/personalize";
import { buildSplitShares } from "@/lib/expenses/split";
import { personName } from "@/lib/rotation";
import type { ExpenseEntry, PersonId } from "@/lib/types";

type ExpenseTab = PersonId | "total";
type EntryMode = "single" | "split";

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
      className={`glass-card rounded-2xl border p-4 ${
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
          {entry.personId && (
            <p className="mt-0.5 text-xs text-pine-500">
              {personName(entry.personId)}
            </p>
          )}
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
  const { viewScope, isAdmin } = usePersonSession();
  const { config, people, personIds } = useHouseholdConfig();
  const { entries: allEntries, totals, loading, error, addEntry, addSplitExpense, mergeCreated, removeEntry } =
    useExpenses(personIds);
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [entryMode, setEntryMode] = useState<EntryMode>("single");
  const [personId, setPersonId] = useState<PersonId | "">(
    () => (viewScope && !viewScope.isAdmin ? viewScope.personId : ""),
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ExpenseTab>("total");

  useEffect(() => {
    if (viewScope && !viewScope.isAdmin) {
      setPersonId(viewScope.personId);
      setActiveTab(viewScope.personId);
    } else {
      setActiveTab("total");
    }
  }, [viewScope]);

  const entries = useMemo(
    () => filterExpenses(allEntries, viewScope),
    [allEntries, viewScope],
  );

  const byPerson = useMemo(() => {
    return people.map((person) => ({
      person,
      income: entries.filter((e) => e.type === "income" && e.personId === person.id),
      expense: entries.filter((e) => e.type === "expense" && e.personId === person.id),
      stats: totals.byPerson[person.id],
    }));
  }, [entries, totals.byPerson, people]);

  const unassignedExpense = useMemo(
    () => entries.filter((e) => e.type === "expense" && !e.personId),
    [entries],
  );

  const splitPreview = useMemo(() => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0 || entryMode !== "split") return null;
    return buildSplitShares(parsed, personIds);
  }, [amount, entryMode, personIds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0 || !comment.trim()) return;

    if (entryMode === "split" && type === "expense") {
      setSubmitting(true);
      setFormError(null);
      try {
        await addSplitExpense({
          amount: parsed,
          comment: comment.trim(),
        });
        setAmount("");
        setComment("");
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Failed to split expense");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (type === "income" && !personId) {
      setFormError("Select who received this income");
      return;
    }

    const assignee =
      lockedPersonId(viewScope) ?? (personId ? personId : undefined);

    setSubmitting(true);
    setFormError(null);
    try {
      await addEntry({
        type,
        amount: parsed,
        comment: comment.trim(),
        personId: assignee,
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
    return <LoadingState label="Loading expenses…" />;
  }

  const activePerson =
    activeTab !== "total"
      ? byPerson.find((p) => p.person.id === activeTab)
      : null;

  const personStats = viewScope && !viewScope.isAdmin
    ? totals.byPerson[viewScope.personId]
    : null;

  return (
    <div className="space-y-5">
      {(error || formError) && <Alert>{error ?? formError}</Alert>}

      <PageHeader
        title="Expenses"
        subtitle={
          isAdmin
            ? "Track household income & spending"
            : "Your income and expenses"
        }
      />

      {isAdmin ? (
        <div className="glass-card flex flex-wrap gap-1.5 p-1.5">
          {people.map((person) => (
            <button
              key={person.id}
              type="button"
              onClick={() => setActiveTab(person.id)}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === person.id
                ? "bg-sea-500/15 text-sea-400 ring-1 ring-sea-500/30"
                : "text-onyx-400 hover:bg-onyx-800/60 hover:text-onyx-200"
            }`}
            >
              {person.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setActiveTab("total")}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === "total"
                ? "bg-fawn-500/15 text-fawn-400 ring-1 ring-fawn-500/30"
                : "text-onyx-400 hover:bg-onyx-800/60 hover:text-onyx-200"
            }`}
          >
            Total
          </button>
        </div>
      ) : personStats ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-sea-500/20 bg-sea-500/5 p-3">
            <p className="text-xs text-onyx-500">Your income</p>
            <p className="text-lg font-bold text-sea-400">{formatINR(personStats.income)}</p>
          </div>
          <div className="rounded-xl border border-fawn-500/20 bg-fawn-500/5 p-3">
            <p className="text-xs text-onyx-500">Your expense</p>
            <p className="text-lg font-bold text-fawn-400">{formatINR(personStats.expense)}</p>
          </div>
          <div className="rounded-xl border border-onyx-800 bg-onyx-900 p-3">
            <p className="text-xs text-onyx-500">Your balance</p>
            <p
              className={`text-lg font-bold ${
                personStats.balance >= 0 ? "text-sea-400" : "text-fawn-400"
              }`}
            >
              {formatINR(personStats.balance)}
            </p>
          </div>
        </div>
      ) : null}

      {isAdmin && activeTab === "total" ? (
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
      ) : isAdmin && activePerson ? (
        <PersonRecords
          personName={activePerson.person.name}
          income={activePerson.income}
          expense={activePerson.expense}
          stats={activePerson.stats}
          onRemove={handleRemove}
        />
      ) : !isAdmin && activePerson ? (
        <PersonRecords
          personName={activePerson.person.name}
          income={activePerson.income}
          expense={activePerson.expense}
          stats={activePerson.stats}
          onRemove={handleRemove}
        />
      ) : null}

      <ExpenseTemplates viewScope={viewScope} onApplied={mergeCreated} />

      <ExpenseRecap entries={entries} showHousehold={isAdmin} />

      <form
        onSubmit={handleSubmit}
        className="glass-card space-y-4 p-5 sm:p-6"
      >
        <h3 className="font-semibold text-onyx-100">Add entry</h3>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setType("expense");
            }}
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
            onClick={() => {
              setType("income");
              setEntryMode("single");
            }}
            className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
              type === "income"
                ? "border-sea-500/50 bg-sea-500/10 text-sea-400"
                : "border-onyx-700 text-onyx-400 hover:border-onyx-600"
            }`}
          >
            Income
          </button>
        </div>

        {type === "expense" && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEntryMode("single")}
              className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                entryMode === "single"
                  ? "border-pine-600/50 bg-pine-900/40 text-pine-300"
                  : "border-onyx-700 text-onyx-400 hover:border-onyx-600"
              }`}
            >
              Single entry
            </button>
            <button
              type="button"
              onClick={() => setEntryMode("split")}
              className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                entryMode === "split"
                  ? "border-pine-600/50 bg-pine-900/40 text-pine-300"
                  : "border-onyx-700 text-onyx-400 hover:border-onyx-600"
              }`}
            >
              Split equally
            </button>
          </div>
        )}

        {entryMode === "single" && (
        <div>
          <label className="mb-2 block text-xs text-onyx-400">
            {type === "income" ? "Who received this?" : "Paid by (optional)"}
          </label>
          {isAdmin ? (
            <div className="grid grid-cols-4 gap-2">
              {people.map((person) => (
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
          ) : (
            <p className="rounded-lg border border-onyx-700 bg-onyx-950 px-3 py-2 text-sm text-pine-400">
              {people.find((p) => p.id === personId)?.name}
            </p>
          )}
        </div>
        )}

        {entryMode === "split" && type === "expense" && (
          <p className="rounded-lg border border-pine-800/50 bg-pine-900/30 px-3 py-2 text-sm text-pine-300">
            Total is split equally between Don, Bijo, Suraj, and Adithyan.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-onyx-400">
              {entryMode === "split" ? "Total amount (₹)" : "Amount (₹)"}
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
              placeholder={type === "income" ? "Salary, contribution…" : "Groceries, rent…"}
              className="w-full rounded-lg border border-onyx-700 bg-onyx-950 px-3 py-2.5 text-onyx-100 placeholder:text-onyx-600 focus:border-sea-500 focus:outline-none focus:ring-1 focus:ring-sea-500/30"
            />
          </div>
        </div>

        {splitPreview && (
          <div className="rounded-lg border border-onyx-800 bg-onyx-950 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-onyx-500">
              Split preview
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {splitPreview.map(({ personId: id, amount: share }) => (
                <div
                  key={id}
                  className="rounded-lg border border-onyx-800 bg-onyx-900 px-3 py-2 text-center"
                >
                  <p className="text-xs text-pine-400">{personName(id)}</p>
                  <p className="text-sm font-semibold text-fawn-400">
                    {formatINR(share)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full disabled:opacity-50"
        >
          {submitting
            ? "Saving…"
            : entryMode === "split" && type === "expense"
              ? "Split & add to records"
              : `Add ${type === "expense" ? "expense" : "income"}`}
        </button>
      </form>

      {isAdmin && activeTab === "total" && (
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
