// src/fsrs/create-card.ts

import { createEmptyCard } from "ts-fsrs";

import type { StudentWord } from "../domain/types";

export function createStudentWord(studentId: string, wordId: string): StudentWord {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    studentId,
    wordId,
    fsrsCard: createEmptyCard(),
    correctCount: 0,
    incorrectCount: 0,
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
    averageResponseTimeMs: 0,
    learningProgress: {
      skills: { recognition: 0, recall: 0, production: 0, context: 0 },
      mastery: 0,
      weakestSkill: "recognition",
      state: "new",
      attempts: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      correctStreak: 0,
      averageResponseTimeMs: 0,
    },
    createdAt: now,
    updatedAt: now,
  };
}
