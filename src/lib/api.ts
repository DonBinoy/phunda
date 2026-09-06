import type {
  CompletionsStore,
  CustomTask,
  ExpenseEntry,
  ExpenseTemplate,
  PersonId,
  PersonTotalsMap,
  TodoList,
  TodoItem,
} from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body.error === "string" ? body.error : `Request failed (${res.status})`;
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function fetchCompletions(
  from?: string,
  to?: string,
): Promise<CompletionsStore> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  return request<CompletionsStore>(`/api/completions${qs ? `?${qs}` : ""}`);
}

export async function toggleCompletion(body: {
  date: string;
  category: "daily" | "weekend";
  taskId: string;
  completed?: boolean;
}): Promise<{ date: string; category: string; taskId: string; completed: boolean }> {
  return request("/api/completions/toggle", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function fetchOutsideEatingDays(
  from?: string,
  to?: string,
): Promise<string[]> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  return request<string[]>(`/api/outside-eating${qs ? `?${qs}` : ""}`);
}

export async function toggleOutsideEating(body: {
  date: string;
  active?: boolean;
}): Promise<{ date: string; active: boolean }> {
  return request("/api/outside-eating/toggle", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export interface ExpensesResponse {
  entries: ExpenseEntry[];
  totals: {
    expense: number;
    income: number;
    balance: number;
    byPerson: PersonTotalsMap;
  };
}

export async function fetchExpenses(): Promise<ExpensesResponse> {
  return request<ExpensesResponse>("/api/expenses");
}

export async function createExpense(body: {
  type: "expense" | "income";
  amount: number;
  comment: string;
  personId?: PersonId;
}): Promise<ExpenseEntry> {
  return request<ExpenseEntry>("/api/expenses", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function createSplitExpense(body: {
  amount: number;
  comment: string;
  personIds?: PersonId[];
}): Promise<ExpenseEntry[]> {
  return request<ExpenseEntry[]>("/api/expenses/split", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteExpense(id: string): Promise<void> {
  await request<void>(`/api/expenses/${id}`, { method: "DELETE" });
}

export async function fetchExpenseTemplates(): Promise<ExpenseTemplate[]> {
  return request<ExpenseTemplate[]>("/api/expense-templates");
}

export async function createExpenseTemplate(body: {
  name: string;
  amount: number;
  personId?: PersonId;
  splitEqually?: boolean;
}): Promise<ExpenseTemplate> {
  return request<ExpenseTemplate>("/api/expense-templates", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteExpenseTemplate(id: string): Promise<void> {
  await request<void>(`/api/expense-templates/${id}`, { method: "DELETE" });
}

export async function applyExpenseTemplate(
  id: string,
  body?: { personId?: PersonId },
): Promise<ExpenseEntry | ExpenseEntry[]> {
  return request<ExpenseEntry | ExpenseEntry[]>(
    `/api/expense-templates/${id}/apply`,
    {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    },
  );
}

export async function fetchCustomTasks(
  from?: string,
  to?: string,
): Promise<CustomTask[]> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  return request<CustomTask[]>(`/api/custom-tasks${qs ? `?${qs}` : ""}`);
}

export async function createCustomTask(body: {
  title: string;
  personId: PersonId;
  date: string;
}): Promise<CustomTask> {
  return request<CustomTask>("/api/custom-tasks", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function toggleCustomTask(
  id: string,
  completed?: boolean,
): Promise<CustomTask> {
  return request<CustomTask>(`/api/custom-tasks/${id}/toggle`, {
    method: "PUT",
    body: JSON.stringify({ completed }),
  });
}

export async function deleteCustomTask(id: string): Promise<void> {
  await request<void>(`/api/custom-tasks/${id}`, { method: "DELETE" });
}

export async function fetchTodos(from?: string, to?: string): Promise<TodoList[]> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  return request<TodoList[]>(`/api/todos${qs ? `?${qs}` : ""}`);
}

export async function createTodo(body: {
  title: string;
  personId: PersonId;
  date: string;
  items: string[];
}): Promise<TodoList> {
  return request<TodoList>("/api/todos", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function toggleTodoItem(
  id: string,
  completed?: boolean,
): Promise<TodoItem> {
  return request<TodoItem>(`/api/todos/items/${id}/toggle`, {
    method: "PUT",
    body: JSON.stringify({ completed }),
  });
}

export async function deleteTodo(id: string): Promise<void> {
  await request<void>(`/api/todos/${id}`, { method: "DELETE" });
}

export interface ApiPerson {
  id: string;
  name: string;
  baselineTaskIndex: number;
  sortOrder: number;
  createdAt: string;
}

export interface ApiChore {
  id: string;
  name: string;
  shortName: string;
  category: "daily" | "weekend";
  slots: number;
  sortOrder: number;
  createdAt: string;
}

export async function fetchPeople(): Promise<ApiPerson[]> {
  return request<ApiPerson[]>("/api/people");
}

export async function createPerson(body: { name: string }): Promise<ApiPerson> {
  return request<ApiPerson>("/api/people", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchChores(): Promise<ApiChore[]> {
  return request<ApiChore[]>("/api/chores");
}

export async function createChore(body: {
  name: string;
  shortName?: string;
  category: "daily" | "weekend";
  slots?: number;
}): Promise<ApiChore> {
  return request<ApiChore>("/api/chores", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
