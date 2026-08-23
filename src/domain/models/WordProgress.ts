import type { Card } from "ts-fsrs";

import { WordState } from "../enums/WordState";
import { createEmptySkillProgress, type SkillProgress } from "./SkillProgress";

export interface WordProgress {
  studentId: string;
  wordId: string;
  state: WordState;
  recognition: SkillProgress;
  recall: SkillProgress;
  production: SkillProgress;
  context: SkillProgress;
  totalAttempts: number;
  correctAttempts: number;
  errorCount: number;
  consecutiveCorrect: number;
  consecutiveErrors: number;
  averageResponseTimeMs: number;
  lastReviewedAt?: Date;
  fsrsCard: Card;
  createdAt: Date;
  updatedAt: Date;
}

export function createEmptyWordProgress(studentId: string, wordId: string, now: Date, fsrsCard: Card): WordProgress {
  return {
    studentId,
    wordId,
    state: WordState.New,
    recognition: createEmptySkillProgress(),
    recall: createEmptySkillProgress(),
    production: createEmptySkillProgress(),
    context: createEmptySkillProgress(),
    totalAttempts: 0,
    correctAttempts: 0,
    errorCount: 0,
    consecutiveCorrect: 0,
    consecutiveErrors: 0,
    averageResponseTimeMs: 0,
    fsrsCard,
    createdAt: now,
    updatedAt: now,
  };
}
