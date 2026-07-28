import { ROTATION_EPOCH } from "./constants";
import { getPerformanceRange, computePerformanceForRange, type PerformanceSummary } from "./performance";
import { parseDateKey } from "./rotation";
import type { CompletionsStore, CustomTask, TodoList } from "./types";

export interface GauntletChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  evaluate: (summary: PerformanceSummary) => {
    progress: number;
    target: number;
    completed: boolean;
    label: string;
  };
}

const CHALLENGES: GauntletChallenge[] = [
  {
    id: "clean_sweep",
    title: "Clean Sweep",
    description: "The entire house completes 100% of all assigned tasks this week.",
    icon: "🌪️",
    evaluate: (summary) => {
      const completed = summary.totalCompleted;
      const target = summary.totalAssigned || 1;
      return {
        progress: completed,
        target,
        completed: completed >= target && target > 0,
        label: `${summary.overallRate}% House Completion`,
      };
    },
  },
  {
    id: "weekend_wipeout",
    title: "Weekend Wipeout",
    description: "Every single weekend chore must be completed.",
    icon: "🔥",
    evaluate: (summary) => {
      let weekendDone = 0;
      let weekendAssigned = 0;
      summary.people.forEach(p => {
        weekendDone += p.weekend.completed;
        weekendAssigned += p.weekend.assigned;
      });
      return {
        progress: weekendDone,
        target: weekendAssigned || 1,
        completed: weekendDone >= (weekendAssigned || 1) && weekendAssigned > 0,
        label: `${weekendDone} / ${Math.max(weekendAssigned, 1)} Weekend Chores`,
      };
    },
  },
  {
    id: "extra_mile",
    title: "The Extra Mile",
    description: "Complete at least 15 Custom/Todo tasks collectively this week.",
    icon: "✨",
    evaluate: (summary) => {
      let extraDone = 0;
      summary.people.forEach(p => {
        extraDone += p.custom.completed + p.todo.completed;
      });
      const target = 15;
      return {
        progress: Math.min(extraDone, target),
        target,
        completed: extraDone >= target,
        label: `${extraDone} / ${target} Extra Tasks`,
      };
    },
  },
  {
    id: "daily_dominance",
    title: "Daily Dominance",
    description: "Complete 25 daily chores collectively as a house this week.",
    icon: "⚡",
    evaluate: (summary) => {
      let dailyDone = 0;
      summary.people.forEach(p => {
        dailyDone += p.daily.completed;
      });
      const target = 25;
      return {
        progress: Math.min(dailyDone, target),
        target,
        completed: dailyDone >= target,
        label: `${dailyDone} / ${target} Daily Chores`,
      };
    }
  }
];

function getWeeksSinceEpoch(now: Date): number {
  const epochDate = parseDateKey(ROTATION_EPOCH);
  const diffTime = Math.abs(now.getTime() - epochDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return Math.floor(diffDays / 7);
}

export function getActiveChallenge(now = new Date()): GauntletChallenge {
  const weeks = getWeeksSinceEpoch(now);
  const index = weeks % CHALLENGES.length;
  return CHALLENGES[index];
}

export function evaluateActiveChallenge(
  completions: CompletionsStore,
  customTasks: CustomTask[],
  todos: TodoList[],
  outsideEatingDays: ReadonlySet<string>,
  now = new Date()
) {
  const challenge = getActiveChallenge(now);
  const { from, to, periodLabel } = getPerformanceRange("week", now);
  const summary = computePerformanceForRange(
    from,
    to,
    periodLabel,
    completions,
    customTasks,
    todos,
    outsideEatingDays
  );

  return {
    challenge,
    result: challenge.evaluate(summary),
  };
}
