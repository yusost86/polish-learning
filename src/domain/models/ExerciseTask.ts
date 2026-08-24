import { ExerciseType } from "../enums/ExerciseType";

export interface ChoiceOption {
  id: string;
  label: string;
}

export interface ChoiceExerciseTask {
  exerciseType: ExerciseType.Recognition | ExerciseType.Recall;
  wordId: string;
  prompt: string;
  choices: ChoiceOption[];
  correctChoiceId: string;
}

export interface TypedExerciseTask {
  exerciseType: ExerciseType.Context | ExerciseType.Production;
  wordId: string;
  prompt: string;
  expectedTerm: string;
  /** Ukrainian translation shown as a hint in context exercises. */
  translationHint?: string;
}

export type ExerciseTask = ChoiceExerciseTask | TypedExerciseTask;

export function isChoiceExerciseTask(task: ExerciseTask): task is ChoiceExerciseTask {
  return task.exerciseType === ExerciseType.Recognition || task.exerciseType === ExerciseType.Recall;
}

export function isTypedExerciseTask(task: ExerciseTask): task is TypedExerciseTask {
  return task.exerciseType === ExerciseType.Context || task.exerciseType === ExerciseType.Production;
}

export function isContextExerciseTask(task: ExerciseTask): task is TypedExerciseTask {
  return task.exerciseType === ExerciseType.Context;
}

export function isProductionExerciseTask(task: ExerciseTask): task is TypedExerciseTask {
  return task.exerciseType === ExerciseType.Production;
}
