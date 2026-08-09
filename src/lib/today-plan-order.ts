import { format } from "date-fns";

const STORAGE_KEY = "mission-today-plan-order";

type StoredPlanOrders = Record<string, string[]>;

function storageKey(date: string, areaId: string) {
  return `${date}:${areaId}`;
}

export function todayPlanDateKey(date = new Date()) {
  return format(date, "yyyy-MM-dd");
}

function readAll(): StoredPlanOrders {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredPlanOrders;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(data: StoredPlanOrders) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function readTodayPlanOrder(date: string, areaId: string): string[] | null {
  const order = readAll()[storageKey(date, areaId)];
  return Array.isArray(order) && order.length > 0 ? order : null;
}

export function persistTodayPlanOrder(date: string, areaId: string, taskIds: string[]) {
  const all = readAll();
  all[storageKey(date, areaId)] = taskIds;
  writeAll(all);
}

export function applyPlanOrder<T extends { id: string }>(
  tasks: T[],
  savedOrder: string[] | null,
  defaultSort: (items: T[]) => T[]
): T[] {
  if (!savedOrder?.length) return defaultSort(tasks);

  const byId = new Map(tasks.map((task) => [task.id, task]));
  const ordered: T[] = [];

  for (const id of savedOrder) {
    const task = byId.get(id);
    if (task) {
      ordered.push(task);
      byId.delete(id);
    }
  }

  return [...ordered, ...defaultSort([...byId.values()])];
}
