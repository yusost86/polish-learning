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
  /** A word may be shared by several topics; topicId remains the primary one. */
  topicIds?: string[];
  subtopicId?: string;

  partOfSpeech?: string;

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

  /** Detailed mastery state used by the learning engine. Kept optional so
   * vocabulary created before this feature remains readable. */
  learningProgress?: LearningProgress;

  createdAt: string;
  updatedAt: string;
}

export type LearningExerciseType = "recognition" | "recall" | "production" | "context";
export type LearningWordState = "new" | "introduced" | "learning" | "consolidating" | "mature";

export interface LearningProgress {
  skills: Record<LearningExerciseType, number>;
  mastery: number;
  weakestSkill: LearningExerciseType;
  state: LearningWordState;
  attempts: number;
  correctAnswers: number;
  wrongAnswers: number;
  correctStreak: number;
  averageResponseTimeMs: number;
  lastExerciseType?: LearningExerciseType;
  lastCorrect?: boolean;
  lastReviewedAt?: string;
  nextReviewAt?: string;
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
  /** true when reviewCards were pulled ahead of their FSRS due date because
   * there was nothing new to learn and nothing due yet. */
  aheadOfSchedule: boolean;
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
  ua?: string;
  partOfSpeech?: string;
  "частина_мови"?: string;
}

export interface GlobalProgressSummary {
  totalUniqueWords: number;
  newWordsCount: number;
  learnedWordsCount: number;
  dueNowCount: number;
}
