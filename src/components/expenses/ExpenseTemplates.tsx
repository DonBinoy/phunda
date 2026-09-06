"use client";

import { useState } from "react";
import { useExpenseTemplates } from "@/hooks/useExpenseTemplates";
import { useHouseholdConfig } from "@/context/HouseholdConfigContext";
import { personName } from "@/lib/rotation";
import { lockedPersonId } from "@/lib/personalize";
import type { ViewScope, PersonId, ExpenseEntry } from "@/lib/types";
import { Alert } from "@/components/ui/Alert";
import { LoadingState } from "@/components/ui/LoadingState";

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ExpenseTemplates({
  viewScope,
  onApplied,
}: {
  viewScope: ViewScope | null;
  onApplied: (created: ExpenseEntry | ExpenseEntry[]) => void;
}) {
  const {
    templates,
    loading,
    error,
    addTemplate,
    removeTemplate,
    applyTemplate,
  } = useExpenseTemplates();
  const { people, config } = useHouseholdConfig();
  const [showManager, setShowManager] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [personId, setPersonId] = useState<PersonId | "">("");
  const [splitEqually, setSplitEqually] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const lockedPerson = lockedPersonId(viewScope);
  const isAdmin = viewScope?.isAdmin ?? false;

  const handleApply = async (templateId: string) => {
    setApplyingId(templateId);
    setFormError(null);
    try {
      const created = await applyTemplate(
        templateId,
        lockedPerson ?? undefined,
      );
      onApplied(created);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to add from template",
      );
    } finally {
      setApplyingId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!name.trim() || !parsed || parsed <= 0) return;

    setSubmitting(true);
    setFormError(null);
    try {
      await addTemplate({
        name: name.trim(),
        amount: parsed,
        personId: personId || undefined,
        splitEqually,
      });
      setName("");
      setAmount("");
      setPersonId("");
      setSplitEqually(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create template",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    setFormError(null);
    try {
      await removeTemplate(id);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to delete template",
      );
    }
  };

  if (loading) {
    return <LoadingState label="Loading quick templates…" />;
  }

  return (
    <section className="glass-card space-y-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-onyx-100">Quick add</h3>
          <p className="text-xs text-onyx-500">
            Tap a template to log a daily expense in one tap
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowManager((v) => !v)}
          className="text-xs font-medium text-pine-400 hover:text-pine-300"
        >
          {showManager ? "Hide maker" : "Template maker"}
        </button>
      </div>

      {(error || formError) && <Alert>{error ?? formError}</Alert>}

      {templates.length === 0 ? (
        <p className="rounded-xl border border-dashed border-onyx-800 py-6 text-center text-sm text-onyx-500">
          No templates yet. Create one like &quot;Meals&quot; ₹65 for quick
          daily logging.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={applyingId === t.id}
              onClick={() => handleApply(t.id)}
              className="group rounded-2xl border border-pine-800/50 bg-pine-900/25 px-4 py-3 text-left transition-all hover:border-pine-600/50 hover:bg-pine-900/40 disabled:opacity-50"
            >
              <p className="font-medium text-pine-200">{t.name}</p>
              <p className="text-sm font-bold text-fawn-400">
                {formatINR(t.amount)}
              </p>
              <p className="mt-0.5 text-[10px] text-onyx-600">
                {t.splitEqually
                  ? "Split equally"
                  : t.personId
                    ? personName(t.personId, config)
                    : "Tap to add"}
              </p>
              {applyingId === t.id && (
                <p className="mt-1 text-[10px] text-pine-500">Adding…</p>
              )}
            </button>
          ))}
        </div>
      )}

      {showManager && (
        <div className="space-y-4 border-t border-onyx-800 pt-4">
          <h4 className="text-sm font-medium text-onyx-300">New template</h4>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-onyx-400">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Meals"
                  className="w-full rounded-lg border border-onyx-700 bg-onyx-950 px-3 py-2 text-onyx-100 placeholder:text-onyx-600 focus:border-sea-500 focus:outline-none"
                />
              </div>
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
                  placeholder="65"
                  className="w-full rounded-lg border border-onyx-700 bg-onyx-950 px-3 py-2 text-onyx-100 placeholder:text-onyx-600 focus:border-sea-500 focus:outline-none"
                />
              </div>
            </div>

            {isAdmin && (
              <>
                <div>
                  <label className="mb-2 block text-xs text-onyx-400">
                    Default paid by (optional)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {people.map((person) => (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() =>
                          setPersonId((prev) =>
                            prev === person.id ? "" : person.id,
                          )
                        }
                        className={`rounded-lg border py-2 text-xs font-medium ${
                          personId === person.id
                            ? "border-sea-500/50 bg-sea-500/10 text-sea-400"
                            : "border-onyx-700 text-onyx-400"
                        }`}
                      >
                        {person.name}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-2 text-sm text-onyx-400">
                  <input
                    type="checkbox"
                    checked={splitEqually}
                    onChange={(e) => {
                      setSplitEqually(e.target.checked);
                      if (e.target.checked) setPersonId("");
                    }}
                    className="rounded border-onyx-600"
                  />
                  Split equally between all 4
                </label>
              </>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full sm:w-auto disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save template"}
            </button>
          </form>

          {templates.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-onyx-500">
                Saved templates
              </p>
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border border-onyx-800 bg-onyx-950 px-3 py-2"
                >
                  <div className="text-sm">
                    <span className="text-onyx-200">{t.name}</span>
                    <span className="ml-2 text-fawn-400">
                      {formatINR(t.amount)}
                    </span>
                    {t.splitEqually && (
                      <span className="ml-2 text-xs text-onyx-600">split</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(t.id)}
                    className="text-xs text-onyx-600 hover:text-fawn-400"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
