"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { useHouseholdConfig } from "@/context/HouseholdConfigContext";
import { usePersonSession } from "@/context/PersonSessionContext";
import { getPersonColors } from "@/lib/personColors";

export function AdminManager() {
  const { isAdmin } = usePersonSession();
  const {
    people,
    dailyTasks,
    weekendTasks,
    personIds,
    loading,
    error,
    addPerson,
    addChore,
  } = useHouseholdConfig();

  const [personName, setPersonName] = useState("");
  const [choreName, setChoreName] = useState("");
  const [choreShortName, setChoreShortName] = useState("");
  const [choreCategory, setChoreCategory] = useState<"daily" | "weekend">("daily");
  const [choreSlots, setChoreSlots] = useState(1);
  const [submitting, setSubmitting] = useState<"person" | "chore" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAddPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);
    if (!personName.trim()) {
      setFormError("Enter a name for the new person.");
      return;
    }

    setSubmitting("person");
    try {
      const created = await addPerson(personName.trim());
      setPersonName("");
      setSuccess(`${created.name} was added to the household.`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add person");
    } finally {
      setSubmitting(null);
    }
  };

  const handleAddChore = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);
    if (!choreName.trim()) {
      setFormError("Enter a name for the new chore.");
      return;
    }

    setSubmitting("chore");
    try {
      await addChore({
        name: choreName.trim(),
        shortName: choreShortName.trim() || undefined,
        category: choreCategory,
        slots: choreCategory === "weekend" ? choreSlots : undefined,
      });
      setChoreName("");
      setChoreShortName("");
      setChoreSlots(1);
      setSuccess(`"${choreName.trim()}" was added as a ${choreCategory} chore.`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add chore");
    } finally {
      setSubmitting(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Admin"
          subtitle="Restricted to household administrators only"
        />
        <Alert variant="error">
          Access Denied: Adding new people and managing chore rotations is an Admin-only feature. Please sign in as Admin.
        </Alert>
      </div>
    );
  }

  if (loading) {
    return <LoadingState label="Loading admin settings…" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Admin Panel"
          subtitle="Admin-only feature to add people and configure daily chores"
        />
        <span className="self-start rounded-full border border-sea-500/30 bg-sea-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sea-400">
          Admin Only
        </span>
      </div>

      {(error || formError) && (
        <Alert variant="error">{formError ?? error}</Alert>
      )}
      {success && (
        <div className="flex items-center justify-between rounded-xl border border-sea-500/30 bg-sea-500/10 px-4 py-3 text-sm text-sea-300">
          <span>{success}</span>
          <button
            type="button"
            onClick={() => setSuccess(null)}
            className="text-xs text-sea-400 hover:text-sea-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Overview Stat Counters */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="glass-card rounded-2xl border border-onyx-800/80 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-onyx-500">
            People
          </p>
          <p className="mt-1 text-2xl font-black text-sea-300">
            {people.length}
          </p>
          <p className="text-xs text-onyx-500">Household members</p>
        </div>
        <div className="glass-card rounded-2xl border border-onyx-800/80 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-onyx-500">
            Daily Chores
          </p>
          <p className="mt-1 text-2xl font-black text-fawn-300">
            {dailyTasks.length}
          </p>
          <p className="text-xs text-onyx-500">In daily rotation</p>
        </div>
        <div className="glass-card rounded-2xl border border-onyx-800/80 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-onyx-500">
            Weekend Chores
          </p>
          <p className="mt-1 text-2xl font-black text-pine-300">
            {weekendTasks.length}
          </p>
          <p className="text-xs text-onyx-500">Saturday & Sunday</p>
        </div>
      </div>

      <Section
        title="Household members"
        subtitle="People who can log in and be assigned chores"
      >
        <div className="mb-5 flex flex-wrap gap-2.5">
          {people.map((person) => {
            const colors = getPersonColors(person.id, personIds);
            return (
              <div
                key={person.id}
                className={`flex items-center gap-2.5 rounded-2xl border border-onyx-800/80 px-3.5 py-2 shadow-sm ${colors.bg}`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-xl text-sm font-black ring-1 ${colors.ring} ${colors.text}`}
                >
                  {person.name[0]}
                </span>
                <div>
                  <span className="text-sm font-semibold text-onyx-100">
                    {person.name}
                  </span>
                  <span className="block text-[10px] text-onyx-500">
                    @{person.id}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleAddPerson} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            placeholder="New person name (e.g. Alex)"
            maxLength={100}
            className="flex-1 rounded-xl border border-onyx-700 bg-onyx-900/90 px-4 py-2.5 text-sm text-onyx-100 placeholder:text-onyx-600 focus:border-sea-500 focus:outline-none focus:ring-1 focus:ring-sea-500"
          />
          <button
            type="submit"
            disabled={submitting === "person"}
            className="rounded-xl bg-sea-500 px-5 py-2.5 text-sm font-semibold text-onyx-950 transition hover:bg-sea-400 disabled:opacity-50"
          >
            {submitting === "person" ? "Adding…" : "+ Add Person"}
          </button>
        </form>
      </Section>

      <Section
        title="Recurring chores"
        subtitle="Daily and weekend chores used in the rotation"
      >
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-onyx-800/80 bg-onyx-950/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-fawn-400">
                Daily chores ({dailyTasks.length})
              </p>
              <span className="rounded-md bg-fawn-500/10 px-2 py-0.5 text-[10px] font-semibold text-fawn-400">
                Rotating
              </span>
            </div>
            <ul className="space-y-2">
              {dailyTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between rounded-xl border border-onyx-800/70 bg-onyx-900/60 px-3 py-2 text-sm text-onyx-200"
                >
                  <span className="font-medium">{task.name}</span>
                  <span className="text-xs text-onyx-500">{task.shortName}</span>
                </li>
              ))}
              {dailyTasks.length === 0 && (
                <li className="py-2 text-center text-sm text-onyx-500">
                  No daily chores yet.
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-onyx-800/80 bg-onyx-950/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-pine-400">
                Weekend chores ({weekendTasks.length})
              </p>
              <span className="rounded-md bg-pine-500/10 px-2 py-0.5 text-[10px] font-semibold text-pine-400">
                Sat & Sun
              </span>
            </div>
            <ul className="space-y-2">
              {weekendTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between rounded-xl border border-onyx-800/70 bg-onyx-900/60 px-3 py-2 text-sm text-onyx-200"
                >
                  <span className="font-medium">{task.name}</span>
                  <span className="rounded-full bg-onyx-800 px-2 py-0.5 text-[11px] text-onyx-400">
                    {task.slots} {task.slots === 1 ? "person" : "people"}
                  </span>
                </li>
              ))}
              {weekendTasks.length === 0 && (
                <li className="py-2 text-center text-sm text-onyx-500">
                  No weekend chores yet.
                </li>
              )}
            </ul>
          </div>
        </div>

        <form onSubmit={handleAddChore} className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-onyx-400">
              Chore Type:
            </span>
            <button
              type="button"
              onClick={() => setChoreCategory("daily")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                choreCategory === "daily"
                  ? "bg-fawn-500 text-onyx-950 ring-1 ring-fawn-400"
                  : "bg-onyx-900 text-onyx-400 hover:bg-onyx-800 hover:text-onyx-200"
              }`}
            >
              Daily Chore (Daily Rotation)
            </button>
            <button
              type="button"
              onClick={() => setChoreCategory("weekend")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                choreCategory === "weekend"
                  ? "bg-pine-500 text-onyx-950 ring-1 ring-pine-400"
                  : "bg-onyx-900 text-onyx-400 hover:bg-onyx-800 hover:text-onyx-200"
              }`}
            >
              Weekend Chore (Sat & Sun)
            </button>
          </div>

          <p className="text-xs text-onyx-400">
            {choreCategory === "daily"
              ? "Daily chores rotate automatically among all household members each day."
              : "Weekend chores are assigned every Saturday and Sunday."}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={choreName}
              onChange={(e) => setChoreName(e.target.value)}
              placeholder={
                choreCategory === "daily"
                  ? "Daily chore name (e.g. Balcony Sweeping)"
                  : "Weekend chore name (e.g. Deep Fridge Clean)"
              }
              maxLength={200}
              className="flex-1 rounded-xl border border-onyx-700 bg-onyx-900/90 px-4 py-2.5 text-sm text-onyx-100 placeholder:text-onyx-600 focus:border-sea-500 focus:outline-none focus:ring-1 focus:ring-sea-500"
            />
            <input
              type="text"
              value={choreShortName}
              onChange={(e) => setChoreShortName(e.target.value)}
              placeholder="Short label (optional, e.g. Balcony)"
              maxLength={100}
              className="flex-1 rounded-xl border border-onyx-700 bg-onyx-900/90 px-4 py-2.5 text-sm text-onyx-100 placeholder:text-onyx-600 focus:border-sea-500 focus:outline-none focus:ring-1 focus:ring-sea-500"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {choreCategory === "weekend" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-onyx-400">Assign to:</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={choreSlots}
                  onChange={(e) => setChoreSlots(Number(e.target.value) || 1)}
                  className="w-24 rounded-xl border border-onyx-700 bg-onyx-900/90 px-3 py-2 text-sm text-onyx-100"
                  aria-label="Number of people for this chore"
                />
                <span className="text-xs text-onyx-400">people</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting === "chore"}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-onyx-950 transition disabled:opacity-50 sm:ml-auto ${
                choreCategory === "daily"
                  ? "bg-fawn-500 hover:bg-fawn-400"
                  : "bg-pine-500 hover:bg-pine-400"
              }`}
            >
              {submitting === "chore"
                ? "Adding…"
                : choreCategory === "daily"
                  ? "+ Add Daily Chore"
                  : "+ Add Weekend Chore"}
            </button>
          </div>
        </form>
      </Section>
    </div>
  );
}
