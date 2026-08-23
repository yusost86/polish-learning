import { ExerciseType } from "../domain/enums/ExerciseType";

export function exerciseTypeTitle(type: ExerciseType): string {
  if (type === ExerciseType.Recall) {
    return "Пригадування";
  }
  if (type === ExerciseType.Production) {
    return "Продукція";
  }
  if (type === ExerciseType.Context) {
    return "Контекст";
  }
  if (type === ExerciseType.MixedRecall) {
    return "Mixed recall";
  }
  return "Розпізнавання";
}

export function exercisePromptLabel(type: ExerciseType): string {
  if (type === ExerciseType.Recall) {
    return "Оберіть польське слово";
  }
  if (type === ExerciseType.Production) {
    return "Введіть польське слово";
  }
  if (type === ExerciseType.Context) {
    return "Доповніть пропущені літери";
  }
  return "Оберіть переклад";
}

export const EXERCISES_PER_WORD = [
  ExerciseType.Recognition,
  ExerciseType.Recall,
  ExerciseType.Production,
  ExerciseType.Context,
] as const;
