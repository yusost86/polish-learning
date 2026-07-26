// src/learning/exercise-plan.ts

import { starLevel } from "./progress";

import type { StudentWord, Word } from "../domain/types";

export type InteractionKind = "MULTIPLE_CHOICE" | "FILL_BLANK" | "TYPE_IN";

export interface ExercisePlan {
  kind: InteractionKind;
  /** number of letters hidden, only meaningful for FILL_BLANK */
  blanks: number;
}

/**
 * Picks how hard the exercise should be for this card, based on how well the
 * word is already known (FSRS stability, via starLevel 0-5):
 *  - brand new / shaky (0-1 stars)  -> recognize it among 4 options
 *  - getting there (2 stars)        -> type the word with 1 letter hidden
 *  - solid (3 stars)                -> type the word with 2-3 letters hidden
 *  - mastered (4-5 stars)           -> type the whole word from memory
 *
 * Falls back gracefully if the word/session doesn't actually support the
 * chosen kind (e.g. not enough words in the dictionary for multiple choice,
 * or the word wasn't tagged for FILL_BLANK).
 */
export function chooseExercisePlan(
  studentWord: StudentWord,
  word: Word,
  canDoMultipleChoice: boolean,
): ExercisePlan {
  const level = starLevel(studentWord);

  const wantsFillBlank = word.exerciseTypes.includes("FILL_BLANK");

  let kind: InteractionKind;
  if (level <= 1) {
    kind = canDoMultipleChoice ? "MULTIPLE_CHOICE" : wantsFillBlank ? "FILL_BLANK" : "TYPE_IN";
  } else if (level === 2) {
    kind = wantsFillBlank ? "FILL_BLANK" : canDoMultipleChoice ? "MULTIPLE_CHOICE" : "TYPE_IN";
  } else if (level === 3) {
    kind = wantsFillBlank ? "FILL_BLANK" : "TYPE_IN";
  } else {
    kind = "TYPE_IN";
  }

  let blanks = 0;
  if (kind === "FILL_BLANK") {
    blanks = level === 2 ? 1 : 2 + Math.round(Math.random());
  }

  return { kind, blanks };
}

/**
 * Masks `blanks` distinct letters (never spaces) in `answer` with underscores,
 * always leaving at least one letter visible.
 */
export function maskWord(answer: string, blanks: number): string {
  const letterIndices = [...answer].map((ch, i) => ({ ch, i })).filter((x) => /\p{L}/u.test(x.ch));

  const maxBlanks = Math.max(0, Math.min(blanks, letterIndices.length - 1));
  if (maxBlanks <= 0) return answer;

  const shuffled = [...letterIndices].sort(() => Math.random() - 0.5);
  const hideSet = new Set(shuffled.slice(0, maxBlanks).map((x) => x.i));

  return [...answer].map((ch, i) => (hideSet.has(i) ? "_" : ch)).join("");
}

export function normalizeAnswer(text: string): string {
  return text.trim().toLowerCase();
}
