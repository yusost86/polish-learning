import type { ChoiceExerciseTask } from "../domain/models/ExerciseTask";

export function gradeForeignTermAnswer(expectedTerm: string, answer: string): boolean {
  return (
    expectedTerm.trim().toLocaleLowerCase("pl-PL") === answer.trim().toLocaleLowerCase("pl-PL")
  );
}

export function gradeChoiceExercise(task: ChoiceExerciseTask, choiceId: string): boolean {
  return task.correctChoiceId === choiceId;
}

export function getCorrectChoiceLabel(task: ChoiceExerciseTask): string {
  return task.choices.find((choice) => choice.id === task.correctChoiceId)?.label ?? "";
}
