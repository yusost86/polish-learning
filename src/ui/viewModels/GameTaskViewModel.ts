import type { ExerciseTask } from "../../domain/models/ExerciseTask";

export type SessionPhase = "loading" | "exercise" | "feedback" | "complete" | "error";

export interface SessionProgress {
  current: number;
  total: number;
}

export interface GameSessionViewModel {
  phase: SessionPhase;
  task: ExerciseTask | null;
  progress: SessionProgress;
  selectedChoiceId: string | null;
  isCorrect: boolean | null;
  correctAnswerLabel: string;
  topicId?: string;
  modeLabel: string;
}
