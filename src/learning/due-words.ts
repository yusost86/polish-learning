// src/learning/due-words.ts

import type { StudentWord } from "../domain/types";

export function getDueCards(cards: StudentWord[], now: Date = new Date()): StudentWord[] {
  return cards
    .filter((card) => new Date(card.fsrsCard.due) <= now)
    .sort((a, b) => new Date(a.fsrsCard.due).getTime() - new Date(b.fsrsCard.due).getTime());
}
