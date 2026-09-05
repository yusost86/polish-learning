import type { ExerciseTask } from "../domain/models/ExerciseTask";
import { isChoiceExerciseTask, isTypedExerciseTask } from "../domain/models/ExerciseTask";
import {
  getCorrectChoiceLabel,
  gradeChoiceExercise,
  gradeForeignTermAnswer,
} from "./exerciseGrading";
import type { SessionAnswer } from "./types/session";

export interface GradedAnswer {
  isCorrect: boolean;
  correctAnswerLabel: string;
}

export function gradeSessionAnswer(task: ExerciseTask, answer: SessionAnswer): GradedAnswer {
  if (answer.type === "choice") {
    if (!isChoiceExerciseTask(task)) {
      throw new Error("Expected choice answer for choice exercise");
    }
    const isCorrect = gradeChoiceExercise(task, answer.choiceId);
    return {
      isCorrect,
      correctAnswerLabel: getCorrectChoiceLabel(task),
    };
  }

  if (!isTypedExerciseTask(task)) {
    throw new Error("Expected typed answer for typed exercise");
  }

  const isCorrect = gradeForeignTermAnswer(task.expectedTerm, answer.text);
  return {
    isCorrect,
    correctAnswerLabel: task.expectedTerm,
  };
}
