import type { DailyTask, Person, PersonId, WeekendTask } from "./types";

export const PEOPLE: Person[] = [
  { id: "don", name: "Don" },
  { id: "bijo", name: "Bijo" },
  { id: "suraj", name: "Suraj" },
  { id: "adithyan", name: "Adithyan" },
];

export const DAILY_TASKS: DailyTask[] = [
  { id: "paathram", name: "Paathram Kazhukk", shortName: "Paathram" },
  { id: "veg", name: "Veg Ariyal", shortName: "Veg Ariyal" },
  { id: "kari", name: "Cooking (Kari)", shortName: "Kari" },
  { id: "rice", name: "Cooking (Rice/Main)", shortName: "Rice/Main" },
];

export const WEEKEND_TASKS: WeekendTask[] = [
  { id: "kitchen", name: "Kitchen Cleaning", slots: 2 },
  { id: "bathroom", name: "Bathroom Cleaning", slots: 1 },
  { id: "room", name: "Room Cleaning", slots: 1 },
];

/** Day-0 baseline: Don→paathram, Bijo→rice, Suraj→veg, Adithyan→kari */
export const BASELINE_PERSON_TASKS: Record<string, number> = {
  don: 0,
  bijo: 3,
  suraj: 1,
  adithyan: 2,
};

/** Each day every person moves to the next task in this 4-day cycle */
export const TASK_ROTATION: number[] = [2, 0, 3, 1];

export const TASK_IDS = DAILY_TASKS.map((t) => t.id);
export const PERSON_IDS = PEOPLE.map((p) => p.id);

export const ROTATION_EPOCH = "2026-07-06";

/** Kitchen cleaning alternates between these pairs each weekend */
export const KITCHEN_PAIR_A: readonly PersonId[] = ["don", "suraj"];
export const KITCHEN_PAIR_B: readonly PersonId[] = ["bijo", "adithyan"];

/** Shifts kitchen pair so Jul 11 2026 weekend = Bijo & Adithyan (Don & Suraj did last weekend) */
export const WEEKEND_KITCHEN_OFFSET = 1;
