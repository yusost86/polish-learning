// src/domain/types.ts

import type { Card, Grade } from "ts-fsrs";

export type ExerciseType =
  | "NATIVE_TO_FOREIGN"
  | "FOREIGN_TO_NATIVE"
  | "MULTIPLE_CHOICE"
  | "FILL_BLANK"
  | "CONTEXT";

export interface Topic {
  id: string;
  name: string;
  createdAt: string;
}

export interface Subtopic {
  id: string;
  topicId: string;
  name: string;
}

export interface Word {
  id: string;

  foreignText: string; // Polish
  nativeText: string; // Ukrainian

  topicId: string;
  subtopicId?: string;

  importance: number;

  exerciseTypes: ExerciseType[];

  createdAt: string;
}

export interface StudentWord {
  id: string;

  studentId: string;
  wordId: string;

  // FSRS state
  fsrsCard: Card;

  // Application statistics
  correctCount: number;
  incorrectCount: number;

  consecutiveCorrect: number;
  consecutiveIncorrect: number;

  averageResponseTimeMs: number;

  lastExerciseType?: ExerciseType;

  createdAt: string;
  updatedAt: string;
}

export interface ReviewEvent {
  id: string;

  wordId: string;

  timestamp: string;

  exerciseType: ExerciseType;

  grade: Grade;

  isCorrect: boolean;

  responseTimeMs: number;

  errorType?: string;
}

export interface LearningSession {
  reviewCards: StudentWord[];
  newCards: StudentWord[];
  newWords: Word[];
}

// A word combined with its (optional) learning progress, used by UI screens
export interface WordProgressRecord {
  word: Word;
  studentWord?: StudentWord;
  topicName?: string;
}

// Shape of the JSON snippet a user pastes in to add vocabulary
export interface WordModelDTO {
  pl: string;
  uk: string;
  topic?: string;
}

export interface GlobalProgressSummary {
  totalUniqueWords: number;
  newWordsCount: number;
  learnedWordsCount: number;
  dueNowCount: number;
}
