import type { Word } from "../../domain/models/Word";
import { ExerciseType } from "../../domain/enums/ExerciseType";
import type { TypedExerciseTask } from "../../domain/models/ExerciseTask";

const CONTEXT_BLANK = "______";

export function gradeForeignTermAnswer(expectedTerm: string, answer: string): boolean {
  return (
    expectedTerm.trim().toLocaleLowerCase("pl-PL") === answer.trim().toLocaleLowerCase("pl-PL")
  );
}

/** @deprecated Use gradeForeignTermAnswer */
export const gradeContextAnswer = gradeForeignTermAnswer;

/** Masks foreign (PL) term: first 2 letters visible, then alternate hidden/shown. e.g. dworzec → dw_r_e_ */
export function maskForeignTerm(term: string): string {
  return term
    .split("")
    .map((char, index) => {
      if (index < 2) {
        return char;
      }
      return index % 2 === 0 ? "_" : char;
    })
    .join("");
}

export function buildContextPrompt(word: Word): string {
  const maskedTerm = maskForeignTerm(word.term);

  if (word.contextSentence?.includes(CONTEXT_BLANK)) {
    return word.contextSentence.replace(CONTEXT_BLANK, maskedTerm);
  }

  return maskedTerm;
}

export function buildContextTask(word: Word): TypedExerciseTask {
  return {
    exerciseType: ExerciseType.Context,
    wordId: word.id,
    prompt: buildContextPrompt(word),
    expectedTerm: word.term,
    translationHint: word.translation,
  };
}

export function buildProductionTask(word: Word): TypedExerciseTask {
  return {
    exerciseType: ExerciseType.Production,
    wordId: word.id,
    prompt: word.translation,
    expectedTerm: word.term,
  };
}
