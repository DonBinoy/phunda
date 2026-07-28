import {
  computeBestStreak,
  computeCompletionStreak,
  computeHouseCup,
  computeMonthlyPodium,
  computePerformanceForRange,
  countDailyTaskCompletions,
  countPerfectDays,
  countWeekendTaskCompletions,
  getPerformanceRange,
  hasClutchMonthFinish,
  hasSundayPerfect,
  listPodiumMonths,
  maxPerfectDaysInWeek,
  type PersonPerformance,
} from "./performance";
import type {
  CompletionsStore,
  CustomTask,
  PersonId,
  TodoList,
} from "./types";

export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: "star" | "crown" | "medal" | "flame" | "target" | "zap" | "trophy";
  rarity: AchievementRarity;
  /** Hidden until unlocked — shows as ??? while locked */
  secret?: boolean;
}

export interface AchievementProgress {
  current: number;
  target: number;
}

export interface EvaluatedAchievement extends AchievementDef {
  unlocked: boolean;
  unlockedLabel?: string;
  progress?: AchievementProgress;
}

function pushMilestone(
  results: EvaluatedAchievement[],
  def: AchievementDef & { target: number },
  current: number,
  unlockedLabel?: string,
) {
  results.push({
    ...def,
    unlocked: current >= def.target,
    unlockedLabel:
      current >= def.target
        ? (unlockedLabel ?? `${current} / ${def.target}`)
        : undefined,
    progress: def.secret
      ? undefined
      : {
          current: Math.min(current, def.target),
          target: def.target,
        },
  });
}

function personStats(
  people: PersonPerformance[],
  personId: PersonId,
): PersonPerformance | undefined {
  return people.find((p) => p.personId === personId);
}

/** Title under name — best unlocked title-worthy badge. */
const TITLE_ORDER: Array<{ id: string; title: string }> = [
  { id: "dynasty", title: "Dynasty" },
  { id: "legend_200", title: "Living Legend" },
  { id: "house_cup_champ", title: "House Cup Champion" },
  { id: "century_club", title: "Century Club" },
  { id: "repeat_champion", title: "Repeat Champion" },
  { id: "last_month_champion", title: "Monthly Champion" },
  { id: "streak_14", title: "Iron Will" },
  { id: "perfect_month", title: "Flawless" },
  { id: "elite_rate", title: "Elite" },
  { id: "perfect_day_50", title: "Never Miss" },
  { id: "triple_medal", title: "Full Medals" },
  { id: "comeback_throne", title: "Throne Taker" },
  { id: "night_owl", title: "Night Owl" },
  { id: "hat_trick", title: "Hat Trick" },
  { id: "clutch", title: "Clutch" },
  { id: "dark_horse", title: "Dark Horse" },
  { id: "kitchen_closer", title: "Kitchen Closer" },
  { id: "half_century", title: "Half Century" },
  { id: "streak_7", title: "Unstoppable" },
  { id: "weekend_legend", title: "Weekend Legend" },
  { id: "month_leader", title: "Month Leader" },
  { id: "task_machine", title: "Task Machine" },
  { id: "weekend_warrior", title: "Weekend Warrior" },
  { id: "daily_grind", title: "Daily Grind" },
  { id: "first_steps", title: "Chore Cadet" },
];

export function getPersonTitle(
  achievements: EvaluatedAchievement[],
): string {
  const unlocked = new Map(
    achievements.filter((a) => a.unlocked).map((a) => [a.id, a]),
  );
  for (const t of TITLE_ORDER) {
    if (unlocked.has(t.id)) return t.title;
  }
  const any = achievements.find((a) => a.unlocked && a.rarity === "legendary");
  if (any) return any.title;
  const epic = achievements.find((a) => a.unlocked && a.rarity === "epic");
  if (epic) return epic.title;
  return "Roommate";
}

export function displayAchievement(
  achievement: EvaluatedAchievement,
): Pick<EvaluatedAchievement, "title" | "description"> {
  if (achievement.secret && !achievement.unlocked) {
    return {
      title: "Secret achievement",
      description: "Keep grinding — this one stays hidden until you unlock it.",
    };
  }
  return {
    title: achievement.title,
    description: achievement.description,
  };
}

export function evaluateAchievements(
  personId: PersonId,
  completions: CompletionsStore,
  customTasks: CustomTask[],
  todos: TodoList[],
  outsideEatingDays: ReadonlySet<string>,
  now = new Date(),
): EvaluatedAchievement[] {
  const allRange = getPerformanceRange("all", now);
  const allTime = computePerformanceForRange(
    allRange.from,
    allRange.to,
    "All time",
    completions,
    customTasks,
    todos,
    outsideEatingDays,
  );
  const me = personStats(allTime.people, personId);
  const completed = me?.completed ?? 0;
  const dailyDone = me?.daily.completed ?? 0;
  const weekendDone = me?.weekend.completed ?? 0;
  const customDone = me?.custom.completed ?? 0;
  const todoDone = me?.todo.completed ?? 0;
  const rate = me?.rate ?? 0;

  const streak = computeCompletionStreak(
    personId,
    completions,
    outsideEatingDays,
    now,
  );
  const bestStreak = computeBestStreak(
    personId,
    completions,
    outsideEatingDays,
    now,
  );
  const perfectDays = countPerfectDays(
    personId,
    completions,
    outsideEatingDays,
    now,
  );
  const byTask = countDailyTaskCompletions(
    personId,
    completions,
    outsideEatingDays,
    now,
  );
  const byWeekend = countWeekendTaskCompletions(personId, completions, now);
  const hatTrick = maxPerfectDaysInWeek(
    personId,
    completions,
    outsideEatingDays,
    now,
  );
  const clutch = hasClutchMonthFinish(
    personId,
    completions,
    outsideEatingDays,
    now,
  );
  const houseCup = computeHouseCup(
    completions,
    customTasks,
    todos,
    outsideEatingDays,
    now,
  );

  const results: EvaluatedAchievement[] = [];

  // —— Volume milestones ——
  pushMilestone(
    results,
    {
      id: "first_steps",
      title: "First Steps",
      description: "Complete your first chore",
      icon: "star",
      rarity: "common",
      target: 1,
    },
    completed,
    `${completed} chores completed`,
  );
  pushMilestone(
    results,
    {
      id: "getting_going",
      title: "Getting Going",
      description: "Complete 10 chores",
      icon: "zap",
      rarity: "common",
      target: 10,
    },
    completed,
  );
  pushMilestone(
    results,
    {
      id: "task_machine",
      title: "Task Machine",
      description: "Complete 25 chores",
      icon: "target",
      rarity: "rare",
      target: 25,
    },
    completed,
  );
  pushMilestone(
    results,
    {
      id: "house_hero",
      title: "House Hero",
      description: "Complete 40 chores",
      icon: "trophy",
      rarity: "rare",
      target: 40,
    },
    completed,
  );
  pushMilestone(
    results,
    {
      id: "half_century",
      title: "Half Century",
      description: "Complete 50 chores",
      icon: "trophy",
      rarity: "epic",
      target: 50,
    },
    completed,
  );
  pushMilestone(
    results,
    {
      id: "relentless",
      title: "Relentless",
      description: "Complete 75 chores",
      icon: "flame",
      rarity: "epic",
      target: 75,
    },
    completed,
  );
  pushMilestone(
    results,
    {
      id: "century_club",
      title: "Century Club",
      description: "Complete 100 chores",
      icon: "crown",
      rarity: "legendary",
      target: 100,
    },
    completed,
  );
  pushMilestone(
    results,
    {
      id: "legend_200",
      title: "Living Legend",
      description: "Complete 200 chores",
      icon: "crown",
      rarity: "legendary",
      target: 200,
    },
    completed,
  );

  // —— Category specialists ——
  pushMilestone(
    results,
    {
      id: "daily_starter",
      title: "Daily Starter",
      description: "Complete 5 daily chores",
      icon: "zap",
      rarity: "common",
      target: 5,
    },
    dailyDone,
  );
  pushMilestone(
    results,
    {
      id: "daily_grind",
      title: "Daily Grind",
      description: "Complete 20 daily chores",
      icon: "zap",
      rarity: "rare",
      target: 20,
    },
    dailyDone,
  );
  pushMilestone(
    results,
    {
      id: "daily_dominator",
      title: "Daily Dominator",
      description: "Complete 50 daily chores",
      icon: "zap",
      rarity: "epic",
      target: 50,
    },
    dailyDone,
  );

  pushMilestone(
    results,
    {
      id: "weekend_rookie",
      title: "Weekend Rookie",
      description: "Complete 3 weekend chores",
      icon: "flame",
      rarity: "common",
      target: 3,
    },
    weekendDone,
  );
  pushMilestone(
    results,
    {
      id: "weekend_warrior",
      title: "Weekend Warrior",
      description: "Complete 8 weekend chores",
      icon: "flame",
      rarity: "rare",
      target: 8,
    },
    weekendDone,
  );
  pushMilestone(
    results,
    {
      id: "weekend_legend",
      title: "Weekend Legend",
      description: "Complete 20 weekend chores",
      icon: "flame",
      rarity: "epic",
      target: 20,
    },
    weekendDone,
  );

  pushMilestone(
    results,
    {
      id: "extra_mile",
      title: "Extra Mile",
      description: "Complete 5 custom tasks",
      icon: "star",
      rarity: "common",
      target: 5,
    },
    customDone,
  );
  pushMilestone(
    results,
    {
      id: "list_crusher",
      title: "List Crusher",
      description: "Complete 15 todo items",
      icon: "target",
      rarity: "rare",
      target: 15,
    },
    todoDone,
  );
  pushMilestone(
    results,
    {
      id: "all_rounder",
      title: "All-Rounder",
      description: "Complete at least 1 daily, weekend, custom, and todo",
      icon: "trophy",
      rarity: "epic",
      target: 4,
    },
    [dailyDone > 0, weekendDone > 0, customDone > 0, todoDone > 0].filter(
      Boolean,
    ).length,
    "Touched every category",
  );

  // —— Chore specialties ——
  pushMilestone(
    results,
    {
      id: "paathram_pro",
      title: "Paathram Pro",
      description: "Finish Paathram Kazhukk 10 times",
      icon: "star",
      rarity: "rare",
      target: 10,
    },
    byTask.paathram,
  );
  pushMilestone(
    results,
    {
      id: "veg_virtuoso",
      title: "Veg Virtuoso",
      description: "Finish Veg Ariyal 10 times",
      icon: "star",
      rarity: "rare",
      target: 10,
    },
    byTask.veg,
  );
  pushMilestone(
    results,
    {
      id: "kari_king",
      title: "Kari King",
      description: "Finish Cooking (Kari) 10 times",
      icon: "flame",
      rarity: "rare",
      target: 10,
    },
    byTask.kari,
  );
  pushMilestone(
    results,
    {
      id: "rice_master",
      title: "Rice Master",
      description: "Finish Cooking (Rice/Main) 10 times",
      icon: "trophy",
      rarity: "rare",
      target: 10,
    },
    byTask.rice,
  );
  pushMilestone(
    results,
    {
      id: "kitchen_complete",
      title: "Full Kitchen",
      description: "Complete each daily chore type at least once",
      icon: "trophy",
      rarity: "epic",
      target: 4,
    },
    Object.values(byTask).filter((n) => n > 0).length,
    "All four daily chores unlocked",
  );

  // —— Streaks & perfect days ——
  pushMilestone(
    results,
    {
      id: "streak_3",
      title: "On a Roll",
      description: "Finish all chores 3 days in a row",
      icon: "flame",
      rarity: "rare",
      target: 3,
    },
    Math.max(streak, bestStreak),
    `${Math.max(streak, bestStreak)}-day streak`,
  );
  pushMilestone(
    results,
    {
      id: "streak_7",
      title: "Unstoppable",
      description: "Finish all chores 7 days in a row",
      icon: "flame",
      rarity: "epic",
      target: 7,
    },
    Math.max(streak, bestStreak),
  );
  pushMilestone(
    results,
    {
      id: "streak_14",
      title: "Iron Will",
      description: "Finish all chores 14 days in a row",
      icon: "flame",
      rarity: "legendary",
      target: 14,
    },
    Math.max(streak, bestStreak),
  );
  pushMilestone(
    results,
    {
      id: "perfect_day_5",
      title: "Clean Sweep",
      description: "Have 5 perfect days (all chores done)",
      icon: "target",
      rarity: "rare",
      target: 5,
    },
    perfectDays,
  );
  pushMilestone(
    results,
    {
      id: "perfect_day_20",
      title: "Consistency King",
      description: "Have 20 perfect days",
      icon: "target",
      rarity: "epic",
      target: 20,
    },
    perfectDays,
  );
  pushMilestone(
    results,
    {
      id: "perfect_day_50",
      title: "Never Miss",
      description: "Have 50 perfect days",
      icon: "crown",
      rarity: "legendary",
      target: 50,
    },
    perfectDays,
  );

  // —— Period quality ——
  const week = computePerformanceForRange(
    getPerformanceRange("week", now).from,
    getPerformanceRange("week", now).to,
    "This week",
    completions,
    customTasks,
    todos,
    outsideEatingDays,
  );
  const weekMe = personStats(week.people, personId);
  const perfectWeek =
    !!weekMe && weekMe.assigned >= 3 && weekMe.completed === weekMe.assigned;

  results.push({
    id: "perfect_week",
    title: "Perfect Week",
    description: "Complete 100% of this week's chores (min 3)",
    icon: "target",
    rarity: "epic",
    unlocked: perfectWeek,
    unlockedLabel: perfectWeek
      ? `${weekMe!.completed}/${weekMe!.assigned} this week`
      : undefined,
    progress: weekMe
      ? {
          current: weekMe.completed,
          target: Math.max(weekMe.assigned, 3),
        }
      : { current: 0, target: 3 },
  });

  const thisMonth = computePerformanceForRange(
    getPerformanceRange("month", now).from,
    getPerformanceRange("month", now).to,
    "This month",
    completions,
    customTasks,
    todos,
    outsideEatingDays,
  );
  const monthMe = personStats(thisMonth.people, personId);
  const perfectMonth =
    !!monthMe &&
    monthMe.assigned >= 5 &&
    monthMe.completed === monthMe.assigned;
  const solidMonth = !!monthMe && monthMe.assigned >= 5 && monthMe.rate >= 80;

  results.push({
    id: "solid_month",
    title: "Solid Month",
    description: "Hit 80%+ completion this month (min 5 chores)",
    icon: "medal",
    rarity: "rare",
    unlocked: solidMonth,
    unlockedLabel: solidMonth ? `${monthMe!.rate}% this month` : undefined,
    progress: monthMe
      ? { current: Math.min(monthMe.rate, 80), target: 80 }
      : { current: 0, target: 80 },
  });

  results.push({
    id: "perfect_month",
    title: "Flawless Month",
    description: "Complete 100% of assigned chores this month (min 5)",
    icon: "target",
    rarity: "legendary",
    unlocked: perfectMonth,
    unlockedLabel: perfectMonth
      ? `${monthMe!.completed}/${monthMe!.assigned} this month`
      : undefined,
    progress: monthMe
      ? {
          current: monthMe.completed,
          target: Math.max(monthMe.assigned, 5),
        }
      : { current: 0, target: 5 },
  });

  results.push({
    id: "reliable",
    title: "Mr. Reliable",
    description: "Reach 70%+ all-time completion rate (min 10 chores)",
    icon: "medal",
    rarity: "rare",
    unlocked: completed >= 10 && rate >= 70,
    unlockedLabel:
      completed >= 10 && rate >= 70 ? `${rate}% all-time` : undefined,
    progress: {
      current: completed >= 10 ? Math.min(rate, 70) : 0,
      target: 70,
    },
  });

  results.push({
    id: "elite_rate",
    title: "Elite Standard",
    description: "Reach 90%+ all-time completion rate (min 20 chores)",
    icon: "crown",
    rarity: "legendary",
    unlocked: completed >= 20 && rate >= 90,
    unlockedLabel:
      completed >= 20 && rate >= 90 ? `${rate}% all-time` : undefined,
    progress: {
      current: completed >= 20 ? Math.min(rate, 90) : 0,
      target: 90,
    },
  });

  // —— Podium / rivalry ——
  const months = listPodiumMonths(now);
  let goldCount = 0;
  let silverCount = 0;
  let bronzeCount = 0;
  let lastMonthChampion = false;
  let lastMonthPodium = false;
  let improvedFromLast = false;

  let prevRank: number | null = null;

  months.forEach(({ year, month }, index) => {
    const podium = computeMonthlyPodium(
      year,
      month,
      completions,
      customTasks,
      todos,
      outsideEatingDays,
      now,
    );
    const [gold, silver, bronze] = podium.places;
    const place =
      gold?.personId === personId
        ? 1
        : silver?.personId === personId
          ? 2
          : bronze?.personId === personId
            ? 3
            : 0;

    if (place === 1) goldCount++;
    if (place === 2) silverCount++;
    if (place === 3) bronzeCount++;

    if (index === 1 && podium.isComplete) {
      if (place === 1) lastMonthChampion = true;
      if (place > 0) lastMonthPodium = true;
    }

    // Comeback: current month rank better than previous completed month
    if (index === 0 && place > 0) {
      prevRank = place;
    }
    if (index === 1 && podium.isComplete && prevRank !== null && place > 0) {
      if (prevRank < place) improvedFromLast = true;
    }

    if (place === 0) return;

    const placeTitle =
      place === 1 ? "Champion" : place === 2 ? "Silver" : "Bronze";
    const rarity: AchievementRarity =
      place === 1 ? "legendary" : place === 2 ? "epic" : "rare";

    results.push({
      id: `podium_${podium.monthKey}_${place}`,
      title: `${podium.label} ${placeTitle}`,
      description: `Finished #${place} on the ${podium.label} podium`,
      icon: place === 1 ? "crown" : "medal",
      rarity,
      unlocked: true,
      unlockedLabel: `#${place} · ${podium.places[place - 1]?.completed ?? 0} tasks`,
    });
  });

  results.push({
    id: "last_month_podium",
    title: "Podium Finish",
    description: "Finish top 3 last month",
    icon: "medal",
    rarity: "rare",
    unlocked: lastMonthPodium,
    unlockedLabel: lastMonthPodium ? "Made last month's podium" : undefined,
    progress: { current: lastMonthPodium ? 1 : 0, target: 1 },
  });

  results.push({
    id: "last_month_champion",
    title: "Last Month's Champion",
    description: "Finish #1 on last month's podium",
    icon: "crown",
    rarity: "legendary",
    unlocked: lastMonthChampion,
    unlockedLabel: lastMonthChampion ? "Ruled the house last month" : undefined,
    progress: { current: lastMonthChampion ? 1 : 0, target: 1 },
  });

  results.push({
    id: "comeback_kid",
    title: "Comeback Kid",
    description: "Improve your monthly podium place vs last month",
    icon: "zap",
    rarity: "epic",
    unlocked: improvedFromLast,
    unlockedLabel: improvedFromLast ? "Climbed the ranks" : undefined,
    progress: { current: improvedFromLast ? 1 : 0, target: 1 },
  });

  pushMilestone(
    results,
    {
      id: "podium_regular",
      title: "Podium Regular",
      description: "Reach the monthly top 3 at least twice",
      icon: "medal",
      rarity: "epic",
      target: 2,
    },
    goldCount + silverCount + bronzeCount,
  );
  pushMilestone(
    results,
    {
      id: "triple_medal",
      title: "Full Medal Set",
      description: "Earn gold, silver, and bronze across months",
      icon: "trophy",
      rarity: "legendary",
      target: 3,
    },
    [goldCount > 0, silverCount > 0, bronzeCount > 0].filter(Boolean).length,
    "Gold + Silver + Bronze collected",
  );
  pushMilestone(
    results,
    {
      id: "repeat_champion",
      title: "Repeat Champion",
      description: "Win the monthly gold twice",
      icon: "crown",
      rarity: "legendary",
      target: 2,
    },
    goldCount,
  );
  pushMilestone(
    results,
    {
      id: "dynasty",
      title: "Dynasty",
      description: "Win the monthly gold three times",
      icon: "crown",
      rarity: "legendary",
      target: 3,
    },
    goldCount,
  );

  // This week leader
  const weekLeader = week.topPerformer === personId && (weekMe?.completed ?? 0) > 0;
  results.push({
    id: "week_leader",
    title: "Week Leader",
    description: "Be #1 on this week's leaderboard",
    icon: "zap",
    rarity: "rare",
    unlocked: weekLeader,
    unlockedLabel: weekLeader ? "Leading this week" : undefined,
    progress: { current: weekLeader ? 1 : 0, target: 1 },
  });

  const monthLeader =
    thisMonth.topPerformer === personId && (monthMe?.completed ?? 0) > 0;
  results.push({
    id: "month_leader",
    title: "Month Leader",
    description: "Be #1 on this month's live standings",
    icon: "crown",
    rarity: "epic",
    unlocked: monthLeader,
    unlockedLabel: monthLeader ? "Leading this month" : undefined,
    progress: { current: monthLeader ? 1 : 0, target: 1 },
  });

  // —— House Cup ——
  const cupChamp = houseCup.champion === personId;
  results.push({
    id: "house_cup_champ",
    title: "House Cup Champion",
    description: `Lead the ${houseCup.season.label}`,
    icon: "crown",
    rarity: "legendary",
    unlocked: cupChamp,
    unlockedLabel: cupChamp
      ? `${houseCup.standings[0]?.points ?? 0} season points`
      : undefined,
    progress: {
      current: cupChamp ? 1 : 0,
      target: 1,
    },
  });

  const myCup = houseCup.standings.find((s) => s.personId === personId);
  pushMilestone(
    results,
    {
      id: "cup_contender",
      title: "Cup Contender",
      description: "Earn 30 House Cup points this season",
      icon: "trophy",
      rarity: "epic",
      target: 30,
    },
    myCup?.points ?? 0,
  );

  // —— Secret achievements ——
  pushMilestone(
    results,
    {
      id: "hat_trick",
      title: "Hat Trick",
      description: "Log 3 perfect days in a single week",
      icon: "zap",
      rarity: "epic",
      secret: true,
      target: 3,
    },
    hatTrick,
    `${hatTrick} perfect days in a week`,
  );

  results.push({
    id: "clutch",
    title: "Clutch",
    description: "Clear every chore on the last day of a month",
    icon: "target",
    rarity: "epic",
    secret: true,
    unlocked: clutch,
    unlockedLabel: clutch ? "Month-end closer" : undefined,
  });

  pushMilestone(
    results,
    {
      id: "kitchen_closer",
      title: "Kitchen Closer",
      description: "Finish kitchen cleaning 5 times",
      icon: "flame",
      rarity: "rare",
      secret: true,
      target: 5,
    },
    byWeekend.kitchen,
  );
  pushMilestone(
    results,
    {
      id: "bathroom_boss",
      title: "Bathroom Boss",
      description: "Finish bathroom cleaning 5 times",
      icon: "star",
      rarity: "rare",
      secret: true,
      target: 5,
    },
    byWeekend.bathroom,
  );
  pushMilestone(
    results,
    {
      id: "room_ranger",
      title: "Room Ranger",
      description: "Finish room cleaning 5 times",
      icon: "star",
      rarity: "rare",
      secret: true,
      target: 5,
    },
    byWeekend.room,
  );

  const darkHorse = goldCount === 0 && goldCount + silverCount + bronzeCount >= 3;
  results.push({
    id: "dark_horse",
    title: "Dark Horse",
    description: "Hit the podium 3 times without ever taking gold",
    icon: "medal",
    rarity: "epic",
    secret: true,
    unlocked: darkHorse,
    unlockedLabel: darkHorse ? "Always close, never crowned… yet" : undefined,
  });

  // Comeback throne: last month bronze (or off podium) → this month gold
  let comebackThrone = false;
  if (months.length >= 2) {
    const curr = computeMonthlyPodium(
      months[0].year,
      months[0].month,
      completions,
      customTasks,
      todos,
      outsideEatingDays,
      now,
    );
    const prev = computeMonthlyPodium(
      months[1].year,
      months[1].month,
      completions,
      customTasks,
      todos,
      outsideEatingDays,
      now,
    );
    const currGold = curr.places[0]?.personId === personId;
    const prevPlace =
      prev.places[0]?.personId === personId
        ? 1
        : prev.places[1]?.personId === personId
          ? 2
          : prev.places[2]?.personId === personId
            ? 3
            : 0;
    if (currGold && prev.isComplete && (prevPlace === 0 || prevPlace >= 3)) {
      comebackThrone = true;
    }
  }
  results.push({
    id: "comeback_throne",
    title: "Throne Taker",
    description: "Jump from off-podium/bronze last month to gold this month",
    icon: "crown",
    rarity: "legendary",
    secret: true,
    unlocked: comebackThrone,
    unlockedLabel: comebackThrone ? "From the shadows to the throne" : undefined,
  });

  // "Night Owl" — perfect day on a Sunday
  const sundayPerfect = hasSundayPerfect(
    personId,
    completions,
    outsideEatingDays,
    now,
  );

  results.push({
    id: "night_owl",
    title: "Night Owl",
    description: "Clear all chores on a Sunday",
    icon: "flame",
    rarity: "rare",
    secret: true,
    unlocked: sundayPerfect,
  });

  const rarityRank: Record<AchievementRarity, number> = {
    legendary: 0,
    epic: 1,
    rare: 2,
    common: 3,
  };

  return results.sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    if (a.unlocked && b.unlocked) {
      return rarityRank[a.rarity] - rarityRank[b.rarity];
    }
    return a.title.localeCompare(b.title);
  });
}

export function achievementCounts(achievements: EvaluatedAchievement[]) {
  const unlocked = achievements.filter((a) => a.unlocked).length;
  return { unlocked, total: achievements.length };
}
