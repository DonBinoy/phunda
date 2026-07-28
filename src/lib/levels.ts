export type LevelTier = "wood" | "bronze" | "silver" | "gold" | "platinum" | "diamond" | "radiant";

export interface PersonLevel {
  level: number;
  tier: LevelTier;
  xp: number;
  nextLevelXp: number;
  progressPct: number;
}

const XP_PER_TASK = 10;
const TASKS_PER_LEVEL = 10;

export function computePersonLevel(completedTasks: number): PersonLevel {
  const xp = completedTasks * XP_PER_TASK;
  const level = Math.floor(completedTasks / TASKS_PER_LEVEL) + 1;
  const nextLevelTasks = level * TASKS_PER_LEVEL;
  const nextLevelXp = nextLevelTasks * XP_PER_TASK;
  
  const currentLevelBaseXp = (level - 1) * TASKS_PER_LEVEL * XP_PER_TASK;
  const progressWithinLevel = xp - currentLevelBaseXp;
  const levelSpan = nextLevelXp - currentLevelBaseXp;
  const progressPct = Math.min(Math.max((progressWithinLevel / levelSpan) * 100, 0), 100);

  let tier: LevelTier = "wood";
  if (level >= 30) tier = "radiant";
  else if (level >= 20) tier = "diamond";
  else if (level >= 15) tier = "platinum";
  else if (level >= 10) tier = "gold";
  else if (level >= 5) tier = "silver";
  else if (level >= 2) tier = "bronze";

  return {
    level,
    tier,
    xp,
    nextLevelXp,
    progressPct,
  };
}
