import type { ExerciseTask } from "../../domain/models/ExerciseTask";
import type { SessionMode } from "../../domain/enums/SessionMode";

export interface SessionStartParams {
  mode: SessionMode;
  topicId?: string;
}

export interface SessionStartResult {
  sessionId: string;
  tasks: ExerciseTask[];
  topicName: string;
  modeLabel: string;
}

export type SessionAnswer =
  | { type: "choice"; choiceId: string }
  | { type: "typed"; text: string };

export interface SubmitAnswerParams {
  sessionId: string;
  taskIndex: number;
  answer: SessionAnswer;
  responseTimeMs: number;
}

export interface SubmitAnswerResult {
  isCorrect: boolean;
  correctAnswerLabel: string;
  isSessionComplete: boolean;
  nextTaskIndex: number;
}
