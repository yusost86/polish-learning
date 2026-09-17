import type { SessionMode } from "../domain/enums/SessionMode";

export type { SessionMode };

export function sessionModeLabel(mode?: SessionMode): string {
  if (mode === "new") {
    return "Вивчити нові";
  }
  if (mode === "due") {
    return "Повторити";
  }
  return "Режим не задано";
}
