import {
  createEmptyCard,
  fsrs,
  Rating,
  State,
  type Card,
} from "ts-fsrs";

import {
  EASY_CONSECUTIVE_CORRECT,
  OVERDUE_CAP_DAYS,
  SLOW_THRESHOLD_MS,
} from "../domain/constants";
import { Grade } from "../domain/enums/Grade";
import type { WordProgress } from "../domain/models/WordProgress";

const scheduler = fsrs({ enable_fuzz: false });

export function mapAnswerToGrade(
  correct: boolean,
  responseTimeMs: number,
  consecutiveCorrect: number,
): Grade {
  if (!correct) {
    return Grade.Again;
  }
  if (responseTimeMs > SLOW_THRESHOLD_MS) {
    return Grade.Hard;
  }
  if (consecutiveCorrect >= EASY_CONSECUTIVE_CORRECT) {
    return Grade.Easy;
  }
  return Grade.Good;
}

export function gradeToRating(grade: Grade): Rating {
  switch (grade) {
    case Grade.Again:
      return Rating.Again;
    case Grade.Hard:
      return Rating.Hard;
    case Grade.Good:
      return Rating.Good;
    case Grade.Easy:
      return Rating.Easy;
  }
}

export function isDue(card: Card, now: Date): boolean {
  return card.due.getTime() <= now.getTime();
}

export function isNewCard(card: Card): boolean {
  return card.state === State.New && card.reps === 0;
}

export function isReviewDue(card: Card, now: Date): boolean {
  return isDue(card, now) && !isNewCard(card);
}

export function overdueDays(card: Card, now: Date): number {
  if (!isDue(card, now)) {
    return 0;
  }
  const diffMs = now.getTime() - card.due.getTime();
  return diffMs / (1000 * 60 * 60 * 24);
}

export function overdueScore(card: Card, now: Date): number {
  return Math.min(overdueDays(card, now) / OVERDUE_CAP_DAYS, 1);
}

export function formatFsrsStatus(card: Card, now: Date): string {
  if (isNewCard(card)) {
    return "New";
  }
  if (isDue(card, now)) {
    const days = Math.floor(overdueDays(card, now));
    return days > 0 ? `Due +${days}d` : "Due";
  }
  const daysUntil = Math.ceil((card.due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return `${daysUntil}d`;
}

export function createInitialCard(now: Date): Card {
  return createEmptyCard(now);
}

export function applyFsrsReview(progress: WordProgress, grade: Grade, now: Date): Card {
  const rating = gradeToRating(grade) as import("ts-fsrs").Grade;
  const { card } = scheduler.next(progress.fsrsCard, now, rating);
  return card;
}

export class FsrsService {
  mapAnswerToGrade(
    correct: boolean,
    responseTimeMs: number,
    consecutiveCorrect: number,
  ): Grade {
    return mapAnswerToGrade(correct, responseTimeMs, consecutiveCorrect);
  }

  isDue(card: Card, now: Date): boolean {
    return isDue(card, now);
  }

  isNew(card: Card): boolean {
    return isNewCard(card);
  }

  overdueScore(card: Card, now: Date): number {
    return overdueScore(card, now);
  }

  formatStatus(card: Card, now: Date): string {
    return formatFsrsStatus(card, now);
  }

  applyReview(progress: WordProgress, grade: Grade, now: Date): Card {
    return applyFsrsReview(progress, grade, now);
  }

  createInitialCard(now: Date): Card {
    return createInitialCard(now);
  }
}
