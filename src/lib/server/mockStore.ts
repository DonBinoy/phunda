import crypto from "crypto";
import { AppError } from "@/lib/server/errors";
import { uniqueSlug } from "@/lib/server/slugify";
import { buildSplitShares } from "@/lib/expenses/split";

export interface MockPerson {
  id: string;
  name: string;
  baselineTaskIndex: number;
  sortOrder: number;
  createdAt: string;
}

export interface MockChore {
  id: string;
  name: string;
  shortName: string;
  category: "daily" | "weekend";
  slots: number;
  sortOrder: number;
  createdAt: string;
}

export interface MockCustomTask {
  id: string;
  title: string;
  personId: string;
  date: string;
  completed: boolean;
  createdAt: string;
}

export interface MockTodoItem {
  id: string;
  todoListId: string;
  title: string;
  completed: boolean;
  sortOrder: number;
}

export interface MockTodoList {
  id: string;
  title: string;
  personId: string;
  date: string;
  createdAt: string;
  items?: MockTodoItem[];
}

export interface MockExpense {
  id: string;
  type: "expense" | "income";
  amount: number;
  comment: string;
  personId?: string;
  createdAt: string;
}

export interface MockExpenseTemplate {
  id: string;
  name: string;
  amount: number;
  personId?: string;
  splitEqually: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface MockCompletionKey {
  date: string;
  category: "daily" | "weekend";
  taskId: string;
}

class PhundaMockStore {
  people: MockPerson[] = [
    { id: "don", name: "Don", baselineTaskIndex: 0, sortOrder: 0, createdAt: new Date().toISOString() },
    { id: "bijo", name: "Bijo", baselineTaskIndex: 3, sortOrder: 1, createdAt: new Date().toISOString() },
    { id: "suraj", name: "Suraj", baselineTaskIndex: 1, sortOrder: 2, createdAt: new Date().toISOString() },
    { id: "adithyan", name: "Adithyan", baselineTaskIndex: 2, sortOrder: 3, createdAt: new Date().toISOString() },
  ];

  chores: MockChore[] = [
    { id: "paathram", name: "Paathram Kazhukk", shortName: "Paathram", category: "daily", slots: 1, sortOrder: 0, createdAt: new Date().toISOString() },
    { id: "veg", name: "Veg Ariyal", shortName: "Veg Ariyal", category: "daily", slots: 1, sortOrder: 1, createdAt: new Date().toISOString() },
    { id: "kari", name: "Cooking (Kari)", shortName: "Kari", category: "daily", slots: 1, sortOrder: 2, createdAt: new Date().toISOString() },
    { id: "rice", name: "Cooking (Rice/Main)", shortName: "Rice/Main", category: "daily", slots: 1, sortOrder: 3, createdAt: new Date().toISOString() },
    { id: "kitchen", name: "Kitchen Cleaning", shortName: "Kitchen Cleaning", category: "weekend", slots: 2, sortOrder: 0, createdAt: new Date().toISOString() },
    { id: "bathroom", name: "Bathroom Cleaning", shortName: "Bathroom Cleaning", category: "weekend", slots: 1, sortOrder: 1, createdAt: new Date().toISOString() },
    { id: "room", name: "Room Cleaning", shortName: "Room Cleaning", category: "weekend", slots: 1, sortOrder: 2, createdAt: new Date().toISOString() },
  ];

  completions = new Map<string, boolean>();
  customTasks: MockCustomTask[] = [];
  todoLists: MockTodoList[] = [];
  todoItems: MockTodoItem[] = [];
  expenses: MockExpense[] = [];
  expenseTemplates: MockExpenseTemplate[] = [];
  outsideEatingDays = new Set<string>();

  // People
  getPeople(): MockPerson[] {
    return [...this.people].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  getPersonIds(): string[] {
    return this.getPeople().map((p) => p.id);
  }

  personExists(id: string): boolean {
    return this.people.some((p) => p.id === id);
  }

  async createPerson(name: string): Promise<MockPerson> {
    const dailyCount = Math.max(this.chores.filter((c) => c.category === "daily").length, 1);
    const sortOrder = this.people.length;
    const baselineTaskIndex = sortOrder % dailyCount;
    const id = await uniqueSlug(name, async (candidate) => this.personExists(candidate));

    const person: MockPerson = {
      id,
      name,
      baselineTaskIndex,
      sortOrder,
      createdAt: new Date().toISOString(),
    };
    this.people.push(person);
    return person;
  }

  // Chores
  getChores(): MockChore[] {
    return [...this.chores].sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.sortOrder - b.sortOrder;
    });
  }

  getChoreIds(category?: "daily" | "weekend"): string[] {
    return this.getChores()
      .filter((c) => !category || c.category === category)
      .map((c) => c.id);
  }

  choreExists(id: string): boolean {
    return this.chores.some((c) => c.id === id);
  }

  async createChore(data: {
    name: string;
    shortName?: string;
    category: "daily" | "weekend";
    slots?: number;
  }): Promise<MockChore> {
    const sortOrder = this.chores.filter((c) => c.category === data.category).length;
    const slots = data.category === "weekend" ? (data.slots ?? 1) : 1;
    const shortName = data.shortName?.trim() || data.name.trim();
    const id = await uniqueSlug(data.name, async (candidate) => this.choreExists(candidate));

    const chore: MockChore = {
      id,
      name: data.name,
      shortName,
      category: data.category,
      slots,
      sortOrder,
      createdAt: new Date().toISOString(),
    };
    this.chores.push(chore);
    return chore;
  }

  // Completions
  getCompletions(from?: string, to?: string) {
    const store: Record<
      string,
      { daily: Record<string, boolean>; weekend: Record<string, boolean> }
    > = {};

    for (const [key, completed] of this.completions.entries()) {
      if (!completed) continue;
      const [date, category, taskId] = key.split("::") as [string, "daily" | "weekend", string];
      if (from && date < from) continue;
      if (to && date > to) continue;

      if (!store[date]) {
        store[date] = { daily: {}, weekend: {} };
      }
      store[date][category][taskId] = true;
    }

    return store;
  }

  toggleCompletion(data: {
    date: string;
    category: "daily" | "weekend";
    taskId: string;
    completed?: boolean;
  }) {
    const key = `${data.date}::${data.category}::${data.taskId}`;
    const current = this.completions.get(key) ?? false;
    const next = data.completed !== undefined ? data.completed : !current;
    this.completions.set(key, next);
    return {
      date: data.date,
      category: data.category,
      taskId: data.taskId,
      completed: next,
    };
  }

  // Custom Tasks
  getCustomTasks(from?: string, to?: string): MockCustomTask[] {
    return this.customTasks.filter((t) => {
      if (from && t.date < from) return false;
      if (to && t.date > to) return false;
      return true;
    });
  }

  createCustomTask(data: { title: string; personId: string; date: string }): MockCustomTask {
    const task: MockCustomTask = {
      id: crypto.randomUUID(),
      title: data.title,
      personId: data.personId,
      date: data.date,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    this.customTasks.push(task);
    return task;
  }

  toggleCustomTask(id: string, completed?: boolean): MockCustomTask {
    const task = this.customTasks.find((t) => t.id === id);
    if (!task) throw new AppError(404, `Custom task not found: ${id}`);
    task.completed = completed !== undefined ? completed : !task.completed;
    return task;
  }

  deleteCustomTask(id: string): void {
    const idx = this.customTasks.findIndex((t) => t.id === id);
    if (idx >= 0) this.customTasks.splice(idx, 1);
  }

  // Todos
  getTodos(from?: string, to?: string) {
    const lists = this.todoLists.filter((l) => {
      if (from && l.date < from) return false;
      if (to && l.date > to) return false;
      return true;
    });

    return lists.map((l) => ({
      ...l,
      items: this.todoItems
        .filter((it) => it.todoListId === l.id)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }));
  }

  createTodo(data: { title: string; personId: string; date: string; items: string[] }) {
    const listId = crypto.randomUUID();
    const list: MockTodoList = {
      id: listId,
      title: data.title,
      personId: data.personId,
      date: data.date,
      createdAt: new Date().toISOString(),
    };
    this.todoLists.push(list);

    const createdItems: MockTodoItem[] = data.items.map((title, idx) => ({
      id: crypto.randomUUID(),
      todoListId: listId,
      title,
      completed: false,
      sortOrder: idx,
    }));
    this.todoItems.push(...createdItems);

    return { ...list, items: createdItems };
  }

  toggleTodoItem(id: string, completed?: boolean): MockTodoItem {
    const item = this.todoItems.find((it) => it.id === id);
    if (!item) throw new AppError(404, `Todo item not found: ${id}`);
    item.completed = completed !== undefined ? completed : !item.completed;
    return item;
  }

  deleteTodo(id: string): void {
    const listIdx = this.todoLists.findIndex((l) => l.id === id);
    if (listIdx >= 0) this.todoLists.splice(listIdx, 1);
    this.todoItems = this.todoItems.filter((it) => it.todoListId !== id);
  }

  // Expenses
  getExpenses(): {
    entries: MockExpense[];
    totals: {
      expense: number;
      income: number;
      balance: number;
      byPerson: Record<string, { income: number; expense: number; balance: number }>;
    };
  } {
    const personIds = this.getPersonIds();
    let expense = 0;
    let income = 0;
    const byPerson: Record<string, { income: number; expense: number; balance: number }> = {};
    for (const id of personIds) {
      byPerson[id] = { income: 0, expense: 0, balance: 0 };
    }

    const entries = [...this.expenses].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    for (const e of entries) {
      if (e.type === "expense") expense += e.amount;
      else income += e.amount;

      if (e.personId) {
        if (!byPerson[e.personId]) {
          byPerson[e.personId] = { income: 0, expense: 0, balance: 0 };
        }
        if (e.type === "expense") byPerson[e.personId].expense += e.amount;
        else byPerson[e.personId].income += e.amount;
      }
    }

    for (const id of Object.keys(byPerson)) {
      byPerson[id].balance = byPerson[id].income - byPerson[id].expense;
    }

    return { entries, totals: { expense, income, balance: income - expense, byPerson } };
  }

  createExpense(data: { type: "expense" | "income"; amount: number; comment: string; personId?: string }): MockExpense {
    const entry: MockExpense = {
      id: crypto.randomUUID(),
      type: data.type,
      amount: data.amount,
      comment: data.comment,
      personId: data.personId,
      createdAt: new Date().toISOString(),
    };
    this.expenses.unshift(entry);
    return entry;
  }

  createSplitExpense(data: { amount: number; comment: string; personIds?: string[] }): MockExpense[] {
    const members = data.personIds && data.personIds.length >= 2 ? data.personIds : this.getPersonIds();
    const shares = buildSplitShares(data.amount, members);
    const splitComment = `${data.comment} (split equally)`;
    const created: MockExpense[] = [];

    for (const share of shares) {
      const entry: MockExpense = {
        id: crypto.randomUUID(),
        type: "expense",
        amount: share.amount,
        comment: splitComment,
        personId: share.personId,
        createdAt: new Date().toISOString(),
      };
      this.expenses.unshift(entry);
      created.push(entry);
    }
    return created;
  }

  deleteExpense(id: string): void {
    const idx = this.expenses.findIndex((e) => e.id === id);
    if (idx >= 0) this.expenses.splice(idx, 1);
  }

  // Expense Templates
  getExpenseTemplates(): MockExpenseTemplate[] {
    return [...this.expenseTemplates].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  createExpenseTemplate(data: { name: string; amount: number; personId?: string; splitEqually?: boolean }): MockExpenseTemplate {
    const tpl: MockExpenseTemplate = {
      id: crypto.randomUUID(),
      name: data.name,
      amount: data.amount,
      personId: data.personId,
      splitEqually: !!data.splitEqually,
      sortOrder: this.expenseTemplates.length,
      createdAt: new Date().toISOString(),
    };
    this.expenseTemplates.push(tpl);
    return tpl;
  }

  deleteExpenseTemplate(id: string): void {
    const idx = this.expenseTemplates.findIndex((t) => t.id === id);
    if (idx >= 0) this.expenseTemplates.splice(idx, 1);
  }

  applyExpenseTemplate(id: string, overridePersonId?: string): MockExpense | MockExpense[] {
    const tpl = this.expenseTemplates.find((t) => t.id === id);
    if (!tpl) throw new AppError(404, `Expense template not found: ${id}`);

    if (tpl.splitEqually) {
      return this.createSplitExpense({
        amount: tpl.amount,
        comment: tpl.name,
      });
    }

    const assigned = overridePersonId ?? tpl.personId;
    return this.createExpense({
      type: "expense",
      amount: tpl.amount,
      comment: tpl.name,
      personId: assigned,
    });
  }

  // Outside Eating
  getOutsideEatingDays(from?: string, to?: string): string[] {
    return Array.from(this.outsideEatingDays)
      .filter((d) => {
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      })
      .sort();
  }

  toggleOutsideEating(date: string): { date: string; ateOutside: boolean } {
    if (this.outsideEatingDays.has(date)) {
      this.outsideEatingDays.delete(date);
      return { date, ateOutside: false };
    } else {
      this.outsideEatingDays.add(date);
      return { date, ateOutside: true };
    }
  }
}

const globalForMock = globalThis as unknown as { __phunda_mock_store?: PhundaMockStore };

export const mockStore = globalForMock.__phunda_mock_store ?? new PhundaMockStore();

if (!globalForMock.__phunda_mock_store) {
  globalForMock.__phunda_mock_store = mockStore;
}
