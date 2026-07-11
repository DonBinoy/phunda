import type {
  CustomTask,
  ExpenseEntry,
  PersonId,
  PersonTotalsMap,
  TodoList,
  ViewScope,
} from "./types";

export function filterCustomTasks(
  tasks: CustomTask[],
  scope: ViewScope | null,
): CustomTask[] {
  if (!scope || scope.isAdmin) return tasks;
  return tasks.filter((t) => t.personId === scope.personId);
}

export function filterTodos(
  todos: TodoList[],
  scope: ViewScope | null,
): TodoList[] {
  if (!scope || scope.isAdmin) return todos;
  return todos.filter((t) => t.personId === scope.personId);
}

export function filterExpenses(
  entries: ExpenseEntry[],
  scope: ViewScope | null,
): ExpenseEntry[] {
  if (!scope || scope.isAdmin) return entries;
  return entries.filter((e) => e.personId === scope.personId);
}

export function filterPersonTotals(
  byPerson: PersonTotalsMap,
  scope: ViewScope | null,
): PersonTotalsMap {
  if (!scope || scope.isAdmin) return byPerson;
  return { [scope.personId]: byPerson[scope.personId] } as PersonTotalsMap;
}

export function lockedPersonId(scope: ViewScope | null): PersonId | null {
  if (!scope || scope.isAdmin) return null;
  return scope.personId;
}
