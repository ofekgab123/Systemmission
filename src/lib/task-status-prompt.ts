export type StatusContextType = "WAITING" | "BLOCKED";

export function statusNeedsContextPrompt(status: string): status is StatusContextType {
  return status === "WAITING" || status === "BLOCKED";
}
