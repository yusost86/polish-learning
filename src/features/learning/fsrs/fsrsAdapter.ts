import { createEmptyCard, Rating, type Card, type Grade } from "ts-fsrs";
import type { FsrsGrade } from "../types";

export function createNewFsrsCard(): Card { return createEmptyCard(); }

/** Converts the learning module's stable grade strings to ts-fsrs grades. */
export function toFsrsRating(grade: FsrsGrade): Grade {
  switch (grade) {
    case "again": return Rating.Again;
    case "hard": return Rating.Hard;
    case "good": return Rating.Good;
    case "easy": return Rating.Easy;
  }
}

export function gradeMultipleChoice(correct: boolean, responseTimeMs: number, correctStreak: number): FsrsGrade {
  if (!correct) return "again";
  if (responseTimeMs > 7_000) return "hard";
  if (responseTimeMs < 2_500 && correctStreak >= 3) return "easy";
  return "good";
}
