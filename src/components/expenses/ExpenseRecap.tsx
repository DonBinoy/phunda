"use client";

import { useMemo, useState } from "react";
import {
  computeExpenseRecap,
  type RecapPeriod,
} from "@/lib/expenses/recap";
import { personName } from "@/lib/rotation";
import type { ExpenseEntry } from "@/lib/types";

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ExpenseRecap({
  entries,
  showHousehold,
}: {
  entries: ExpenseEntry[];
  showHousehold: boolean;
}) {
  const [period, setPeriod] = useState<RecapPeriod>("week");

  const recap = useMemo(
    () => computeExpenseRecap(entries, period),
    [entries, period],
  );

  const hasData = recap.expenseCount > 0 || recap.totalIncome > 0;

  return (
    <section className="glass-card space-y-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-onyx-100">Recap</h3>
          <p className="text-xs text-onyx-500">{recap.periodLabel}</p>
        </div>
        <div className="flex gap-1.5 rounded-xl border border-onyx-800 bg-onyx-950 p-1">
          <button
            type="button"
            onClick={() => setPeriod("week")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              period === "week"
                ? "bg-pine-900/60 text-pine-300"
                : "text-onyx-500 hover:text-onyx-300"
            }`}
          >
            This week
          </button>
          <button
            type="button"
            onClick={() => setPeriod("month")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              period === "month"
                ? "bg-pine-900/60 text-pine-300"
                : "text-onyx-500 hover:text-onyx-300"
            }`}
          >
            This month
          </button>
        </div>
      </div>

      {!hasData ? (
        <p className="rounded-xl border border-dashed border-onyx-800 py-8 text-center text-sm text-onyx-500">
          No expenses in this {period === "week" ? "week" : "month"} yet.
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-fawn-500/20 bg-fawn-500/5 p-3">
              <p className="text-xs text-onyx-500">Total spent</p>
              <p className="text-xl font-bold text-fawn-400">
                {formatINR(recap.totalExpense)}
              </p>
              <p className="mt-0.5 text-xs text-onyx-600">
                {recap.expenseCount} expense{recap.expenseCount === 1 ? "" : "s"}
              </p>
            </div>

            {showHousehold && recap.topSpender && (
              <div className="rounded-xl border border-sea-500/20 bg-sea-500/5 p-3">
                <p className="text-xs text-onyx-500">Spent the most</p>
                <p className="text-lg font-bold text-sea-400">
                  {recap.topSpender.name}
                </p>
                <p className="mt-0.5 text-xs text-onyx-600">
                  {formatINR(recap.topSpender.expense)}
                </p>
              </div>
            )}

            {recap.topItem && (
              <div className="rounded-xl border border-pine-800/50 bg-pine-900/30 p-3">
                <p className="text-xs text-onyx-500">Top category</p>
                <p className="text-lg font-bold text-pine-300">
                  {recap.topItem.label}
                </p>
                <p className="mt-0.5 text-xs text-onyx-600">
                  {formatINR(recap.topItem.total)} · {recap.topItem.count}×
                </p>
              </div>
            )}

            {recap.biggestExpense && (
              <div className="rounded-xl border border-onyx-800 bg-onyx-900 p-3">
                <p className="text-xs text-onyx-500">Biggest single expense</p>
                <p className="text-lg font-bold text-onyx-100">
                  {formatINR(recap.biggestExpense.amount)}
                </p>
                <p className="mt-0.5 truncate text-xs text-onyx-600">
                  {recap.biggestExpense.comment}
                  {showHousehold && recap.biggestExpense.personId
                    ? ` · ${personName(recap.biggestExpense.personId)}`
                    : ""}
                </p>
              </div>
            )}
          </div>

          {showHousehold && recap.byPerson.some((p) => p.expense > 0) && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-onyx-500">
                By person
              </p>
              <div className="space-y-2">
                {recap.byPerson
                  .filter((p) => p.expense > 0)
                  .map((row) => {
                    const pct =
                      recap.totalExpense > 0
                        ? Math.round((row.expense / recap.totalExpense) * 100)
                        : 0;
                    return (
                      <div key={row.personId ?? "unassigned"} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-onyx-300">{row.name}</span>
                          <span className="font-medium text-fawn-400">
                            {formatINR(row.expense)}
                            <span className="ml-1 text-xs text-onyx-600">
                              ({pct}%)
                            </span>
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-onyx-800">
                          <div
                            className="h-full rounded-full bg-fawn-500/70"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {recap.byItem.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-onyx-500">
                By item
              </p>
              <div className="divide-y divide-onyx-800/80 rounded-xl border border-onyx-800">
                {recap.byItem.slice(0, 8).map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between px-3 py-2.5 text-sm"
                  >
                    <div>
                      <p className="text-onyx-200">{item.label}</p>
                      <p className="text-xs text-onyx-600">{item.count}×</p>
                    </div>
                    <span className="font-semibold text-fawn-400">
                      {formatINR(item.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recap.biggestExpense && !showHousehold && (
            <p className="text-xs text-onyx-600">
              Largest: {formatINR(recap.biggestExpense.amount)} for{" "}
              {recap.biggestExpense.comment}
            </p>
          )}
        </>
      )}
    </section>
  );
}
