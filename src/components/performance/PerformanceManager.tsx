"use client";

import { useMemo, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Avatar } from "@/components/ui/Avatar";
import { MonthlyPodiumBoard } from "@/components/performance/MonthlyPodiumBoard";
import { RivalryWidget } from "@/components/performance/RivalryWidget";
import { useHouseholdStats } from "@/hooks/useHouseholdStats";
import { PERSON_COLORS } from "@/lib/personColors";
import {
  computeMonthlyPodium,
  computePerformance,
  computeHouseCup,
  listPodiumMonths,
  type PerformancePeriod,
  type PersonPerformance,
} from "@/lib/performance";
import type { PersonId } from "@/lib/types";

const PERIODS: { id: PerformancePeriod; label: string }[] = [
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "all", label: "All time" },
];

const MVP_TAGS = [
  "On fire",
  "House MVP",
  "Crushing it",
  "Leading the pack",
] as const;

function StatPill({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-onyx-800/80 bg-onyx-900/40 p-3">
      <p className="text-[11px] uppercase tracking-wide text-onyx-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-onyx-50">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-onyx-600">{hint}</p>}
    </div>
  );
}

function BreakdownRow({
  label,
  completed,
  assigned,
}: {
  label: string;
  completed: number;
  assigned: number;
}) {
  if (assigned === 0) return null;
  const pct = Math.round((completed / assigned) * 100);
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-onyx-500">{label}</span>
      <span className="tabular-nums text-onyx-300">
        {completed}/{assigned}
        <span className="ml-1.5 text-onyx-600">({pct}%)</span>
      </span>
    </div>
  );
}

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M5 16 3 7l5.5 4L12 4l3.5 7L21 7l-2 9H5Zm0 2h14v2H5v-2Z" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 2.5 13.8 9l6.7.2-5.3 4.2 1.9 6.4L12 16.4 6.9 19.8l1.9-6.4L3.5 9.2 10.2 9 12 2.5Z" />
    </svg>
  );
}

function TopPerformerHero({
  leader,
  periodLabel,
}: {
  leader: PersonPerformance;
  periodLabel: string;
}) {
  const colors = PERSON_COLORS[leader.personId];
  const tag = MVP_TAGS[leader.completed % MVP_TAGS.length];

  return (
    <div
      key={`${leader.personId}-${periodLabel}`}
      className="mvp-card relative overflow-hidden rounded-3xl border border-fawn-500/35 bg-gradient-to-br from-onyx-900 via-onyx-950 to-onyx-900 p-6 shadow-[0_0_60px_rgba(17,238,139,0.12)] sm:p-8"
    >
      <div
        className={`pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-gradient-to-br ${colors.gradient} blur-3xl opacity-70`}
      />
      <div className="pointer-events-none absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-fawn-500/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(17,238,139,0.12),_transparent_55%)]" />

      <SparkleIcon className="mvp-sparkle absolute right-8 top-8 h-4 w-4 text-fawn-400" />
      <SparkleIcon className="mvp-sparkle mvp-sparkle-delay absolute right-20 top-16 h-3 w-3 text-sea-400" />
      <SparkleIcon className="mvp-sparkle mvp-sparkle-delay-2 absolute bottom-10 right-14 h-3.5 w-3.5 text-fawn-300" />
      <SparkleIcon className="mvp-sparkle mvp-sparkle-delay absolute bottom-16 left-10 h-3 w-3 text-sea-300" />

      <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:text-left">
        <div className="relative shrink-0">
          <div className="mvp-pulse-ring absolute inset-0 rounded-full border border-fawn-400/40" />
          <div className="mvp-pulse-ring absolute -inset-2 rounded-full border border-sea-400/25 [animation-delay:0.4s]" />
          <div
            className={`mvp-float relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${colors.gradient} ring-2 ring-fawn-400/50 shadow-[0_0_32px_rgba(209,155,46,0.35)] sm:h-28 sm:w-28`}
          >
            <CrownIcon className="h-11 w-11 text-fawn-300 drop-shadow-[0_0_12px_rgba(209,155,46,0.6)] sm:h-12 sm:w-12" />
          </div>
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-fawn-500 to-sea-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-onyx-950 shadow-lg">
            #1
          </span>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="rounded-full border border-fawn-500/40 bg-fawn-500/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-fawn-300">
              Top performer
            </span>
            <span className="rounded-full border border-sea-500/30 bg-sea-500/10 px-2.5 py-0.5 text-[11px] font-medium text-sea-300">
              {tag}
            </span>
          </div>

          <h3 className="mvp-shimmer-text text-4xl font-black tracking-tight sm:text-5xl">
            {leader.name}
          </h3>

          <p className="text-sm text-onyx-300 sm:text-base">
            Dominating{" "}
            <span className="font-medium text-onyx-100">{periodLabel.toLowerCase()}</span>
            {" — "}
            <span className={`font-semibold ${colors.text}`}>
              {leader.completed} tasks done
            </span>{" "}
            at {leader.rate}% completion
          </p>

          <div className="mx-auto mt-3 max-w-md sm:mx-0">
            <div className="mb-1.5 flex justify-between text-[11px] text-onyx-500">
              <span>Lead margin</span>
              <span className="text-fawn-400">{leader.rate}% rate</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-onyx-800/80">
              <div
                className="mvp-bar-fill h-full rounded-full bg-gradient-to-r from-fawn-500 via-sea-400 to-sea-500 shadow-[0_0_12px_rgba(17,238,139,0.45)]"
                style={{ width: `${Math.max(leader.rate, 8)}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 pt-2 sm:justify-start">
            <span className="rounded-xl border border-onyx-700/80 bg-onyx-900/60 px-3 py-1.5 text-xs text-onyx-300">
              <span className="font-bold text-onyx-50">{leader.daily.completed}</span>{" "}
              daily
            </span>
            <span className="rounded-xl border border-onyx-700/80 bg-onyx-900/60 px-3 py-1.5 text-xs text-onyx-300">
              <span className="font-bold text-onyx-50">{leader.weekend.completed}</span>{" "}
              weekend
            </span>
            <span className="rounded-xl border border-onyx-700/80 bg-onyx-900/60 px-3 py-1.5 text-xs text-onyx-300">
              <span className="font-bold text-onyx-50">
                {leader.custom.completed + leader.todo.completed}
              </span>{" "}
              extras
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PerformanceManager({
  onOpenProfile,
}: {
  onOpenProfile?: (personId: PersonId) => void;
} = {}) {
  const [period, setPeriod] = useState<PerformancePeriod>("week");
  const [podiumIndex, setPodiumIndex] = useState(0);
  const {
    completions,
    customTasks,
    todos,
    outsideEatingDays,
    loading,
    error,
  } = useHouseholdStats();

  const months = useMemo(() => listPodiumMonths(), []);

  const summary = useMemo(
    () =>
      computePerformance(
        period,
        completions,
        customTasks,
        todos,
        outsideEatingDays,
      ),
    [period, completions, customTasks, todos, outsideEatingDays],
  );

  const podium = useMemo(() => {
    const m = months[podiumIndex] ?? months[0];
    if (!m) return null;
    return computeMonthlyPodium(
      m.year,
      m.month,
      completions,
      customTasks,
      todos,
      outsideEatingDays,
    );
  }, [months, podiumIndex, completions, customTasks, todos, outsideEatingDays]);

  const houseCup = useMemo(
    () =>
      computeHouseCup(
        completions,
        customTasks,
        todos,
        outsideEatingDays,
      ),
    [completions, customTasks, todos, outsideEatingDays],
  );

  const weekSummary = useMemo(
    () =>
      computePerformance(
        "week",
        completions,
        customTasks,
        todos,
        outsideEatingDays,
      ),
    [completions, customTasks, todos, outsideEatingDays],
  );

  if (loading) {
    return <LoadingState label="Loading performance…" />;
  }

  const leader = summary.topPerformer
    ? summary.people.find((p) => p.personId === summary.topPerformer)
    : null;
  const maxCompleted = Math.max(...summary.people.map((p) => p.completed), 1);

  return (
    <div className="space-y-5">
      {error && <Alert>{error}</Alert>}

      <PageHeader
        title="Performance"
        subtitle={summary.periodLabel}
        badge="Admin"
        action={
          <div className="flex gap-1.5 rounded-xl border border-onyx-800 bg-onyx-950 p-1">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  period === p.id
                    ? "bg-sea-900/60 text-sea-300"
                    : "text-onyx-500 hover:text-onyx-300"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      {leader && (
        <TopPerformerHero leader={leader} periodLabel={summary.periodLabel} />
      )}

      {period === "week" && (
        <RivalryWidget weekPerformance={weekSummary} />
      )}

      {podium && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              disabled={podiumIndex >= months.length - 1}
              onClick={() => setPodiumIndex((i) => i + 1)}
              className="btn-ghost px-2.5 py-1.5 text-xs disabled:opacity-40"
            >
              ‹ Older
            </button>
            <button
              type="button"
              disabled={podiumIndex === 0}
              onClick={() => setPodiumIndex(0)}
              className="text-[11px] font-medium text-sea-400 hover:text-sea-300 disabled:opacity-40"
            >
              This month
            </button>
            <button
              type="button"
              disabled={podiumIndex === 0}
              onClick={() => setPodiumIndex((i) => Math.max(0, i - 1))}
              className="btn-ghost px-2.5 py-1.5 text-xs disabled:opacity-40"
            >
              Newer ›
            </button>
          </div>
          <MonthlyPodiumBoard
            podium={podium}
            onSelectPerson={onOpenProfile}
          />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatPill
          label="Tasks done"
          value={`${summary.totalCompleted}`}
          hint={`of ${summary.totalAssigned} assigned`}
        />
        <StatPill
          label="Completion rate"
          value={`${summary.overallRate}%`}
          hint="Household average"
        />
        <StatPill
          label="Still pending"
          value={`${Math.max(summary.totalAssigned - summary.totalCompleted, 0)}`}
        />
      </div>

      <Section
        title="Leaderboard"
        subtitle="Tap a name to open their profile · ranked by tasks done"
      >
        {summary.totalAssigned === 0 ? (
          <p className="rounded-xl border border-dashed border-onyx-800 py-10 text-center text-sm text-onyx-500">
            No tasks in this period yet.
          </p>
        ) : (
          <div className="space-y-3">
            {summary.people.map((person, index) => {
              const colors = PERSON_COLORS[person.personId as PersonId];
              const barPct = Math.round((person.completed / maxCompleted) * 100);
              const isTop = person.personId === summary.topPerformer;

              return (
                <button
                  key={person.personId}
                  type="button"
                  onClick={() => onOpenProfile?.(person.personId)}
                  className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                    isTop
                      ? "border-fawn-500/45 bg-gradient-to-r from-fawn-500/10 via-sea-500/10 to-transparent ring-1 ring-fawn-500/25 shadow-[0_0_28px_rgba(209,155,46,0.12)]"
                      : "border-onyx-800/80 bg-onyx-900/30 hover:border-onyx-600"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar personId={person.personId} completedTasks={person.completed} size="md" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4
                            className={`font-semibold ${
                              isTop ? "mvp-shimmer-text text-lg" : colors.text
                            }`}
                          >
                            {person.name}
                          </h4>
                          {isTop && (
                            <span className="chip bg-fawn-500/20 text-fawn-300 ring-1 ring-fawn-500/40">
                              Champion
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-onyx-500">
                          {person.completed} done · {person.pending} pending ·{" "}
                          {person.rate}% rate
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-2xl font-bold tabular-nums ${
                          isTop ? "text-fawn-300" : "text-onyx-50"
                        }`}
                      >
                        {person.completed}
                      </p>
                      <p className="text-[11px] text-onyx-600">completed</p>
                    </div>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-onyx-800">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${
                        isTop
                          ? "from-fawn-500 via-sea-400 to-sea-500"
                          : "from-onyx-600 to-onyx-500"
                      }`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>

                  <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                    <BreakdownRow
                      label="Daily chores"
                      completed={person.daily.completed}
                      assigned={person.daily.assigned}
                    />
                    <BreakdownRow
                      label="Weekend"
                      completed={person.weekend.completed}
                      assigned={person.weekend.assigned}
                    />
                    <BreakdownRow
                      label="Custom tasks"
                      completed={person.custom.completed}
                      assigned={person.custom.assigned}
                    />
                    <BreakdownRow
                      label="Todo items"
                      completed={person.todo.completed}
                      assigned={person.todo.assigned}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Section>

      <Section
        title="Season Rewards"
        subtitle={houseCup.season.label}
      >
        <div className="relative overflow-hidden rounded-3xl border border-onyx-800 bg-gradient-to-br from-onyx-950 to-onyx-900 p-6 shadow-xl">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
            <div className="relative flex shrink-0 items-center justify-center">
              <div className="absolute h-32 w-32 animate-pulse rounded-full bg-fawn-500/20 blur-2xl" />
              <CrownIcon className="relative z-10 h-20 w-20 text-fawn-400 drop-shadow-[0_0_15px_rgba(209,155,46,0.5)]" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-2xl font-black text-fawn-300 sm:text-3xl">House Cup</h3>
              <p className="mt-1 text-sm text-onyx-400">Quarterly cumulative points based on tasks and podium finishes.</p>
              
              <div className="mt-5 space-y-3">
                {houseCup.standings.map((s, idx) => {
                  const c = PERSON_COLORS[s.personId];
                  const isTop = idx === 0 && s.points > 0;
                  return (
                    <div
                      key={s.personId}
                      className={`flex items-center justify-between rounded-xl border p-3 ${
                        isTop ? "border-fawn-500/40 bg-fawn-500/10" : "border-onyx-800 bg-onyx-900/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold ${isTop ? "text-fawn-400" : "text-onyx-500"}`}>
                          #{idx + 1}
                        </span>
                        <span className={`font-semibold ${c.text}`}>{s.name}</span>
                        {isTop && <span className="text-sm">🏆</span>}
                      </div>
                      <div className="text-right">
                        <p className={`font-bold tabular-nums ${isTop ? "text-fawn-300" : "text-onyx-100"}`}>
                          {s.points} pts
                        </p>
                        <p className="text-[10px] text-onyx-500">
                          {s.gold}G {s.silver}S {s.bronze}B
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
