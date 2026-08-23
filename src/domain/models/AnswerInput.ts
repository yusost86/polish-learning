import { ExerciseType } from "../enums/ExerciseType";

export interface AnswerInput {
  studentId: string;
  wordId: string;
  exerciseType: ExerciseType;
  correct: boolean;
  responseTimeMs: number;
}
