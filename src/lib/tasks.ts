import { DAILY_TASKS, WEEKEND_TASKS } from "./constants";
import {
  getDailyAssignments,
  getWeekendAssignments,
  isWeekend,
  personName,
  toDateKey,
} from "./rotation";
import type {
  CompletionsStore,
  CustomTask,
  PendingTaskItem,
  TodoList,
} from "./types";

export function customTaskStats(tasks: CustomTask[]) {
  return {
    total: tasks.length,
    done: tasks.filter((t) => t.completed).length,
  };
}

export function groupCustomTasksByDate(tasks: CustomTask[]) {
  const map: Record<string, CustomTask[]> = {};
  for (const task of tasks) {
    if (!map[task.date]) map[task.date] = [];
    map[task.date].push(task);
  }
  return map;
}

export function groupTodosByDate(todos: TodoList[]) {
  const map: Record<string, TodoList[]> = {};
  for (const todo of todos) {
    if (!map[todo.date]) map[todo.date] = [];
    map[todo.date].push(todo);
  }
  return map;
}

export function todoStats(todos: TodoList[]) {
  let total = 0;
  let done = 0;
  for (const list of todos) {
    total += list.items.length;
    done += list.items.filter((i) => i.completed).length;
  }
  return { total, done };
}

export function getPendingTasks(
  date: Date,
  completions: CompletionsStore,
  customTasks: CustomTask[],
  todos: TodoList[],
): PendingTaskItem[] {
  const dateKey = toDateKey(date);
  const pending: PendingTaskItem[] = [];
  const dayComp = completions[dateKey];

  for (const { taskId, personId } of getDailyAssignments(date)) {
    if (!dayComp?.daily?.[taskId]) {
      const task = DAILY_TASKS.find((t) => t.id === taskId)!;
      pending.push({
        id: `daily-${taskId}`,
        label: task.name,
        assignee: personName(personId),
        kind: "daily",
      });
    }
  }

  if (isWeekend(date)) {
    const weekendAssignments = getWeekendAssignments(date);
    const labels: Record<string, string> = {
      kitchen: "Kitchen Cleaning",
      bathroom: "Bathroom Cleaning",
      room: "Room Cleaning",
    };
    for (const { taskId, personIds } of weekendAssignments) {
      if (!dayComp?.weekend?.[taskId]) {
        pending.push({
          id: `weekend-${taskId}`,
          label: labels[taskId],
          assignee: personIds.map(personName).join(" & "),
          kind: "weekend",
        });
      }
    }
  }

  for (const task of customTasks.filter((t) => t.date === dateKey && !t.completed)) {
    pending.push({
      id: `custom-${task.id}`,
      label: task.title,
      assignee: personName(task.personId),
      kind: "custom",
    });
  }

  for (const list of todos.filter((t) => t.date === dateKey)) {
    for (const item of list.items.filter((i) => !i.completed)) {
      pending.push({
        id: `todo-${item.id}`,
        label: `${list.title}: ${item.title}`,
        assignee: personName(list.personId),
        kind: "todo",
      });
    }
  }

  return pending;
}

export function totalTaskCountForDate(
  date: Date,
  customTasks: CustomTask[],
  todos: TodoList[],
): number {
  const dateKey = toDateKey(date);
  const base =
    4 + (isWeekend(date) ? 3 : 0);
  const custom = customTasks.filter((t) => t.date === dateKey).length;
  const todoItems = todos
    .filter((t) => t.date === dateKey)
    .reduce((sum, t) => sum + t.items.length, 0);
  return base + custom + todoItems;
}

export function completionCountForDateFull(
  date: Date,
  completions: CompletionsStore,
  customTasks: CustomTask[],
  todos: TodoList[],
): number {
  const dateKey = toDateKey(date);
  const dayComp = completions[dateKey];
  const daily = Object.values(dayComp?.daily ?? {}).filter(Boolean).length;
  const weekend = isWeekend(date)
    ? Object.values(dayComp?.weekend ?? {}).filter(Boolean).length
    : 0;
  const custom = customTasks.filter(
    (t) => t.date === dateKey && t.completed,
  ).length;
  const todoDone = todos
    .filter((t) => t.date === dateKey)
    .flatMap((t) => t.items)
    .filter((i) => i.completed).length;
  return daily + weekend + custom + todoDone;
}
