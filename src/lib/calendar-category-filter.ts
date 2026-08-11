/** Filter calendar events by selected category keys (`__none__` = uncategorized). */
export function filterEventsByCategory<T extends { categoryId: string | null }>(
  events: T[],
  categoryFilters: Set<string>
): T[] {
  if (categoryFilters.size === 0) return events;
  return events.filter((occ) => {
    const key = occ.categoryId ?? UNCategorized_CATEGORY_KEY;
    return categoryFilters.has(key);
  });
}

/** Filter calendar tasks by project (category) keys (`__no_project__` = no category). */
export function filterTasksByProject<T extends { projectId: string | null }>(
  tasks: T[],
  projectFilters: Set<string>
): T[] {
  if (projectFilters.size === 0) return tasks;
  return tasks.filter((task) => {
    const key = task.projectId ?? NO_PROJECT_KEY;
    return projectFilters.has(key);
  });
}

export const UNCategorized_CATEGORY_KEY = "__none__";
export const NO_PROJECT_KEY = "__no_project__";
