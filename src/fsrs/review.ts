// src/fsrs/review.ts

import type { Grade } from "ts-fsrs";

import { scheduler } from "./scheduler";
import { db } from "../db/db";

import type { ExerciseType, ReviewEvent, StudentWord } from "../domain/types";

export interface SubmitAnswerParams {
  studentWord: StudentWord;
  exerciseType: ExerciseType;
  grade: Grade;
  isCorrect: boolean;
  responseTimeMs: number;
  errorType?: string;
}

export async function submitAnswer(params: SubmitAnswerParams): Promise<StudentWord> {
  const { studentWord, exerciseType, grade, isCorrect, responseTimeMs, errorType } = params;

  const now = new Date();

  // REAL FSRS SCHEDULING
  const scheduling = scheduler.next(studentWord.fsrsCard, now, grade);

  const updatedCard: StudentWord = {
    ...studentWord,
    fsrsCard: scheduling.card,

    correctCount: isCorrect ? studentWord.correctCount + 1 : studentWord.correctCount,
    incorrectCount: !isCorrect ? studentWord.incorrectCount + 1 : studentWord.incorrectCount,

    consecutiveCorrect: isCorrect ? studentWord.consecutiveCorrect + 1 : 0,
    consecutiveIncorrect: !isCorrect ? studentWord.consecutiveIncorrect + 1 : 0,

    averageResponseTimeMs: calculateAverageTime(studentWord, responseTimeMs),

    lastExerciseType: exerciseType,
    updatedAt: now.toISOString(),
  };

  const event: ReviewEvent = {
    id: crypto.randomUUID(),
    wordId: studentWord.wordId,
    timestamp: now.toISOString(),
    exerciseType,
    grade,
    isCorrect,
    responseTimeMs,
    errorType,
  };

  // Atomic IndexedDB transaction
  await db.transaction("rw", db.studentWords, db.reviewEvents, async () => {
    await db.studentWords.put(updatedCard);
    await db.reviewEvents.add(event);
  });

  return updatedCard;
}

function calculateAverageTime(card: StudentWord, newTime: number): number {
  const total = card.correctCount + card.incorrectCount;

  if (total === 0) {
    return newTime;
  }

  return (card.averageResponseTimeMs * total + newTime) / (total + 1);
}
