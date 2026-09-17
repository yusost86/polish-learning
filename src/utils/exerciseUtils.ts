import { ExerciseType } from "../domain/enums/ExerciseType";

export interface GapSlot {
  char: string;
  hidden: boolean;
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function shuffleLetters(term: string): string[] {
  const letters = Array.from(term);
  if (letters.length <= 1) {
    return letters;
  }
  const next = shuffled(letters);
  if (next.join("") === term) {
    [next[0], next[1]] = [next[1], next[0]];
  }
  return next;
}

export function buildGapSlots(term: string): GapSlot[] {
  const chars = Array.from(term);
  if (chars.length === 0) {
    return [];
  }
  if (chars.length <= 2) {
    return chars.map((char, index) => ({
      char,
      hidden: index === chars.length - 1,
    }));
  }
  return chars.map((char, index) => ({
    char,
    hidden: index >= 2 && index % 2 === 0,
  }));
}

export function exerciseTypeTitle(type: ExerciseType): string {
  switch (type) {
    case ExerciseType.Flashcard:
      return "Картка";
    case ExerciseType.NativeMultipleChoice:
      return "Оберіть переклад";
    case ExerciseType.ForeignMultipleChoice:
      return "Оберіть польське слово";
    case ExerciseType.PutLettersInCorrectOrder:
      return "Складіть слово";
    case ExerciseType.PutMissingLettersInGaps:
      return "Пропущені літери";
    case ExerciseType.InputFullWord:
      return "Введіть слово";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

