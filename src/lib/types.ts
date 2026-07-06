export type PersonId = "don" | "bijo" | "suraj" | "adithyan";

export type DailyTaskId =
  | "paathram"
  | "veg"
  | "kari"
  | "rice";

export type WeekendTaskId = "kitchen" | "bathroom" | "room";

export interface Person {
  id: PersonId;
  name: string;
}

export interface DailyTask {
  id: DailyTaskId;
  name: string;
  shortName: string;
}

export interface WeekendTask {
  id: WeekendTaskId;
  name: string;
  slots: number;
}

export interface DailyAssignment {
  taskId: DailyTaskId;
  personId: PersonId;
}

export interface WeekendAssignment {
  taskId: WeekendTaskId;
  personIds: PersonId[];
}

export interface DayCompletions {
  daily: Partial<Record<DailyTaskId, boolean>>;
  weekend: Partial<Record<WeekendTaskId, boolean>>;
}

export type CompletionsStore = Record<string, DayCompletions>;

export interface ExpenseEntry {
  id: string;
  type: "expense" | "income";
  amount: number;
  comment: string;
  personId?: PersonId;
  createdAt: string;
}

export interface PersonTotals {
  income: number;
  expense: number;
  balance: number;
}

export type PersonTotalsMap = Record<PersonId, PersonTotals>;

export interface CustomTask {
  id: string;
  title: string;
  personId: PersonId;
  date: string;
  completed: boolean;
  createdAt: string;
}

export interface TodoItem {
  id: string;
  todoListId: string;
  title: string;
  completed: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface TodoList {
  id: string;
  title: string;
  personId: PersonId;
  date: string;
  createdAt: string;
  items: TodoItem[];
}

export interface PendingTaskItem {
  id: string;
  label: string;
  assignee?: string;
  kind: "daily" | "weekend" | "custom" | "todo";
}
