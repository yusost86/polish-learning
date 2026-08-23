import { State, type Card } from "ts-fsrs";

import type { StoredFsrsCard, StoredWordProgress } from "../db/database";
import type { WordProgress } from "../domain/models/WordProgress";

export function progressStorageId(studentId: string, wordId: string): string {
  return `${studentId}:${wordId}`;
}

export function topicWaveStorageId(studentId: string, topicId: string): string {
  return `${studentId}:${topicId}`;
}

function serializeCard(card: Card): StoredFsrsCard {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review?.toISOString(),
  };
}

function deserializeCard(stored: StoredFsrsCard): Card {
  return {
    due: new Date(stored.due),
    stability: stored.stability,
    difficulty: stored.difficulty,
    elapsed_days: stored.elapsed_days,
    scheduled_days: stored.scheduled_days,
    learning_steps: stored.learning_steps,
    reps: stored.reps,
    lapses: stored.lapses,
    state: stored.state as State,
    last_review: stored.last_review ? new Date(stored.last_review) : undefined,
  };
}

export function serializeWordProgress(progress: WordProgress): StoredWordProgress {
  return {
    id: progressStorageId(progress.studentId, progress.wordId),
    studentId: progress.studentId,
    wordId: progress.wordId,
    state: progress.state,
    recognition: { ...progress.recognition },
    recall: { ...progress.recall },
    production: { ...progress.production },
    context: { ...progress.context },
    totalAttempts: progress.totalAttempts,
    correctAttempts: progress.correctAttempts,
    errorCount: progress.errorCount,
    consecutiveCorrect: progress.consecutiveCorrect,
    consecutiveErrors: progress.consecutiveErrors,
    averageResponseTimeMs: progress.averageResponseTimeMs,
    lastReviewedAt: progress.lastReviewedAt?.toISOString(),
    fsrsCard: serializeCard(progress.fsrsCard),
    createdAt: progress.createdAt.toISOString(),
    updatedAt: progress.updatedAt.toISOString(),
  };
}

export function deserializeWordProgress(stored: StoredWordProgress): WordProgress {
  return {
    studentId: stored.studentId,
    wordId: stored.wordId,
    state: stored.state,
    recognition: { ...stored.recognition },
    recall: { ...stored.recall },
    production: { ...stored.production },
    context: { ...stored.context },
    totalAttempts: stored.totalAttempts,
    correctAttempts: stored.correctAttempts,
    errorCount: stored.errorCount,
    consecutiveCorrect: stored.consecutiveCorrect,
    consecutiveErrors: stored.consecutiveErrors,
    averageResponseTimeMs: stored.averageResponseTimeMs,
    lastReviewedAt: stored.lastReviewedAt ? new Date(stored.lastReviewedAt) : undefined,
    fsrsCard: deserializeCard(stored.fsrsCard),
    createdAt: new Date(stored.createdAt),
    updatedAt: new Date(stored.updatedAt),
  };
}
