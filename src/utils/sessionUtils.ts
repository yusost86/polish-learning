import type { SessionMode } from "../domain/enums/SessionMode";

export function parseSessionMode(value: string | null): SessionMode | undefined {
  if (value === "new" || value === "due") {
    return value;
  }
  return undefined;
}

export function sessionModeLabel(mode?: SessionMode): string {
  if (mode === "new") {
    return "Вивчити нові";
  }
  if (mode === "due") {
    return "Повторити";
  }
  return "Режим не задано";
}
