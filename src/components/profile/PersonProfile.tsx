"use client";

import { useMemo, useState, useEffect } from "react";
import { Alert } from "@/components/ui/Alert";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Avatar } from "@/components/ui/Avatar";
import { useHouseholdStats } from "@/hooks/useHouseholdStats";
import {
  achievementCounts,
  displayAchievement,
  evaluateAchievements,
  getPersonTitle,
  type AchievementRarity,
  type EvaluatedAchievement,
} from "@/lib/achievements";
import { useHouseholdConfig } from "@/context/HouseholdConfigContext";
import { getPersonColors } from "@/lib/personColors";
import {
  computeCompletionStreak,
  computeMonthlyPodium,
  computePerformance,
} from "@/lib/performance";
import type { PersonId } from "@/lib/types";

const RARITY_STYLES: Record<
  AchievementRarity,
  { border: string; bg: string; text: string; label: string }
> = {
  common: {
    border: "border-onyx-700",
    bg: "bg-onyx-900/50",
    text: "text-onyx-300",
    label: "Common",
  },
  rare: {
    border: "border-sea-500/40",
    bg: "bg-sea-500/10",
    text: "text-sea-300",
    label: "Rare",
  },
  epic: {
    border: "border-pine-400/40",
    bg: "bg-pine-500/10",
    text: "text-pine-300",
    label: "Epic",
  },
  legendary: {
    border: "border-fawn-500/45",
    bg: "bg-fawn-500/10",
    text: "text-fawn-300",
    label: "Legendary",
  },
};

function AchievementIcon({
  icon,
  className,
}: {
  icon: EvaluatedAchievement["icon"];
  className?: string;
}) {
  const common = `fill-current ${className ?? ""}`;
  if (icon === "crown") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden>
        <path d="M5 16 3 7l5.5 4L12 4l3.5 7L21 7l-2 9H5Zm0 2h14v2H5v-2Z" />
      </svg>
    );
  }
  if (icon === "medal") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden>
        <path d="M12 2 9 8H3l5 4-2 7 6-4 6 4-2-7 5-4h-6L12 2Zm0 10.5L9.5 20h5L12 12.5Z" />
      </svg>
    );
  }
  if (icon === "flame") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden>
        <path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-2 1.5-4 2.5-5.5C9 9 8 11 8 13a4 4 0 0 0 8 0c0-4-4-11-4-11Z" />
      </svg>
    );
  }
  if (icon === "trophy") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden>
        <path d="M7 4h10v2h3v3a5 5 0 0 1-4.1 4.9A5 5 0 0 1 13 17.9V19h3v2H8v-2h3v-1.1a5 5 0 0 1-2.9-3.9A5 5 0 0 1 4 9V6h3V4Zm0 2v3a3 3 0 0 0 2.2 2.9L9 12H7a3 3 0 0 1-3-3V6h3Zm10 0h3v3a3 3 0 0 1-3 3h-2l-.2-.1A3 3 0 0 0 17 9V6Z" />
      </svg>
    );
  }
  if (icon === "target") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden>
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 16a6 6 0 1 1 6-6 6 6 0 0 1-6 6Zm0-4a2 2 0 1 0-2-2 2 2 0 0 0 2 2Z" />
      </svg>
    );
  }
  if (icon === "zap") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden>
        <path d="M13 2 4 14h6l-1 8 10-14h-6l1-6Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={common} aria-hidden>
      <path d="M12 2.5 13.8 9l6.7.2-5.3 4.2 1.9 6.4L12 16.4 6.9 19.8l1.9-6.4L3.5 9.2 10.2 9 12 2.5Z" />
    </svg>
  );
}

function AchievementCard({ 
  achievement,
  isPinned,
  onTogglePin,
  canPin
}: { 
  achievement: EvaluatedAchievement;
  isPinned?: boolean;
  onTogglePin?: () => void;
  canPin?: boolean;
}) {
  const rarity = RARITY_STYLES[achievement.rarity];
  const pct =
    achievement.progress && achievement.progress.target > 0
      ? Math.round(
          (achievement.progress.current / achievement.progress.target) * 100,
        )
      : 0;

  const display = displayAchievement(achievement);

  return (
    <div
      className={`relative rounded-2xl border p-4 transition-all ${
        achievement.unlocked
          ? `${rarity.border} ${rarity.bg}`
          : "border-onyx-800/80 bg-onyx-950/40 opacity-55"
      }`}
    >
      {onTogglePin && achievement.unlocked && (
        <button
          type="button"
          onClick={onTogglePin}
          disabled={!isPinned && !canPin}
          className={`absolute right-3 top-3 rounded-full p-1.5 transition-colors ${
            isPinned
              ? "text-fawn-400 bg-fawn-400/10 hover:bg-fawn-400/20"
              : "text-onyx-600 hover:text-onyx-300 hover:bg-onyx-800"
          } disabled:opacity-30`}
          aria-label={isPinned ? "Unpin achievement" : "Pin achievement"}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
            <path d="M16 11.78L20.24 16H13v6l-1 2-1-2v-6H3.76L8 11.78V4h1V2h6v2h1v7.78z" />
          </svg>
        </button>
      )}
      <div className="flex items-start gap-3 pr-8">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            achievement.unlocked
              ? `${rarity.bg} ${rarity.text} ring-1 ${rarity.border}`
              : "bg-onyx-900 text-onyx-600"
          }`}
        >
          <AchievementIcon icon={achievement.icon} className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4
              className={`text-sm font-semibold ${
                achievement.unlocked ? "text-onyx-50" : "text-onyx-500"
              }`}
            >
              {display.title}
            </h4>
            <span className={`text-[10px] font-medium uppercase ${rarity.text}`}>
              {achievement.unlocked || !achievement.secret ? rarity.label : "???"}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-onyx-500">{display.description}</p>
          {achievement.unlocked && achievement.unlockedLabel && (
            <p className={`mt-1.5 text-xs font-medium ${rarity.text}`}>
              {achievement.unlockedLabel}
            </p>
          )}
          {!achievement.unlocked && achievement.progress && (
            <div className="mt-2">
              <div className="mb-1 flex justify-between text-[10px] text-onyx-600">
                <span>Progress</span>
                <span>
                  {achievement.progress.current}/{achievement.progress.target}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-onyx-800">
                <div
                  className="h-full rounded-full bg-onyx-600"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PersonProfileProps {
  personId: PersonId;
  onBack?: () => void;
  canBrowseAll?: boolean;
  onSelectPerson?: (personId: PersonId) => void;
}

export function PersonProfile({
  personId,
  onBack,
  canBrowseAll,
  onSelectPerson,
}: PersonProfileProps) {
  const {
    completions,
    customTasks,
    todos,
    outsideEatingDays,
    loading,
    error,
  } = useHouseholdStats();
  const { people, personIds, config } = useHouseholdConfig();

  const person = people.find((p) => p.id === personId) ?? {
    id: personId,
    name: personId,
  };
  const colors = getPersonColors(personId, personIds);

  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`phunda_pinned_${personId}`);
      if (stored) {
        setPinnedIds(JSON.parse(stored));
      } else {
        setPinnedIds([]);
      }
    } catch {
      // ignore
    }
  }, [personId]);

  const togglePin = (id: string) => {
    setPinnedIds((prev) => {
      const newPins = prev.includes(id)
        ? prev.filter((p) => p !== id)
        : [...prev, id].slice(0, 3);
      localStorage.setItem(`phunda_pinned_${personId}`, JSON.stringify(newPins));
      return newPins;
    });
  };

  const achievements = useMemo(
    () =>
      loading
        ? []
        : evaluateAchievements(
            personId,
            completions,
            customTasks,
            todos,
            outsideEatingDays,
          ),
    [
      loading,
      personId,
      completions,
      customTasks,
      todos,
      outsideEatingDays,
    ],
  );

  const allTime = useMemo(
    () =>
      loading
        ? null
        : computePerformance(
            "all",
            completions,
            customTasks,
            todos,
            outsideEatingDays,
            undefined,
            config,
          ),
    [loading, completions, customTasks, todos, outsideEatingDays, config],
  );

  const thisMonth = useMemo(
    () =>
      loading
        ? null
        : computeMonthlyPodium(
            new Date().getFullYear(),
            new Date().getMonth(),
            completions,
            customTasks,
            todos,
            outsideEatingDays,
            undefined,
            config,
          ),
    [loading, completions, customTasks, todos, outsideEatingDays, config],
  );

  const streak = useMemo(
    () =>
      loading
        ? 0
        : computeCompletionStreak(personId, completions, outsideEatingDays),
    [loading, personId, completions, outsideEatingDays],
  );

  if (loading) {
    return <LoadingState label="Loading profile…" />;
  }

  const stats = allTime?.people.find((p) => p.personId === personId);
  const monthRank =
    thisMonth?.places.findIndex((p) => p?.personId === personId) ?? -1;
  const counts = achievementCounts(achievements);
  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  return (
    <div className="space-y-5">
      {error && <Alert>{error}</Alert>}

      <PageHeader
        title={person.name}
        subtitle="Profile & achievements"
        badge={monthRank >= 0 ? `#${monthRank + 1} this month` : undefined}
        action={
          onBack ? (
            <button type="button" onClick={onBack} className="btn-ghost shrink-0">
              Back
            </button>
          ) : undefined
        }
      />

      {canBrowseAll && onSelectPerson && (
        <div className="flex flex-wrap gap-2">
          {people.map((p) => {
            const c = getPersonColors(p.id, personIds);
            const active = p.id === personId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPerson(p.id)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? `${c.bg} ${c.text} ring-1 ${c.ring} border-transparent`
                    : "border-onyx-800 text-onyx-500 hover:text-onyx-300"
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      )}

      <div
        className={`relative overflow-hidden rounded-3xl border border-onyx-700/60 bg-gradient-to-br ${colors.gradient} p-6`}
      >
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <Avatar personId={personId} completedTasks={stats?.completed ?? 0} size="xl" />
          <div className="text-center sm:text-left">
            <h2 className={`text-3xl font-black tracking-tight ${colors.text}`}>
              {person.name} <span className="text-xl font-bold text-onyx-400 opacity-80">· {getPersonTitle(achievements)}</span>
            </h2>
            <p className="mt-1 text-sm text-onyx-400">
              {counts.unlocked} of {counts.total} achievements unlocked
              {streak > 0 ? ` · ${streak}-day streak` : ""}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-onyx-700/50 bg-onyx-950/40 p-3 text-center">
            <p className="text-2xl font-bold text-onyx-50">
              {stats?.completed ?? 0}
            </p>
            <p className="text-[11px] text-onyx-500">All-time done</p>
          </div>
          <div className="rounded-xl border border-onyx-700/50 bg-onyx-950/40 p-3 text-center">
            <p className="text-2xl font-bold text-onyx-50">
              {stats?.rate ?? 0}%
            </p>
            <p className="text-[11px] text-onyx-500">All-time rate</p>
          </div>
          <div className="rounded-xl border border-onyx-700/50 bg-onyx-950/40 p-3 text-center">
            <p className="text-2xl font-bold text-onyx-50">
              {monthRank >= 0 ? `#${monthRank + 1}` : "—"}
            </p>
            <p className="text-[11px] text-onyx-500">Month rank</p>
          </div>
          <div className="rounded-xl border border-onyx-700/50 bg-onyx-950/40 p-3 text-center">
            <p className="text-2xl font-bold text-onyx-50">{streak}</p>
            <p className="text-[11px] text-onyx-500">Day streak</p>
          </div>
        </div>
      </div>

      <Section
        title="Showcase"
        subtitle="Top achievements"
      >
        {pinnedIds.length === 0 ? (
          <p className="text-sm text-onyx-500">No pinned achievements. Pin up to 3 below.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pinnedIds
              .map((id) => achievements.find((a) => a.id === id))
              .filter((a): a is EvaluatedAchievement => !!a)
              .map((a) => (
                <AchievementCard
                  key={a.id}
                  achievement={a}
                  isPinned={true}
                  onTogglePin={() => togglePin(a.id)}
                />
              ))}
          </div>
        )}
      </Section>

      <Section
        title="Achievements"
        subtitle={`${unlocked.length} unlocked · ${locked.length} still locked`}
      >
        {unlocked.length === 0 && locked.length === 0 ? (
          <p className="text-sm text-onyx-500">No achievements yet.</p>
        ) : (
          <div className="space-y-4">
            {unlocked.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {unlocked.map((a) => (
                  <AchievementCard
                    key={a.id}
                    achievement={a}
                    isPinned={pinnedIds.includes(a.id)}
                    canPin={pinnedIds.length < 3}
                    onTogglePin={() => togglePin(a.id)}
                  />
                ))}
              </div>
            )}
            {locked.length > 0 && (
              <>
                <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-onyx-600">
                  Locked
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {locked.map((a) => (
                    <AchievementCard key={a.id} achievement={a} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </Section>
    </div>
  );
}
