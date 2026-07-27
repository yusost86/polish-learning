import type { Card } from "ts-fsrs";

export interface WordModel {
  id: string;
  term: string;
  translation: string;
  topicId: string;
}

export type WordState =
  | "new"
  | "introduced"
  | "learning"
  | "consolidating"
  | "mature";
export interface SkillScores {
  recognition: number;
  recall: number;
  production: number;
  context: number;
}
export type ExerciseType = keyof SkillScores;
export type ExerciseVariant =
  | "multiple-choice"
  | "reverse-multiple-choice"
  | "typing"
  | "sentence-completion"
  | "translation"
  | "mixed-recall";
export type FsrsGrade = "again" | "hard" | "good" | "easy";

export interface WordLearningStats {
  wordId: string;
  studentId: string;
  topicId: string;
  state: WordState;
  skills: SkillScores;
  mastery: number;
  weakestSkill: ExerciseType;
  attempts: number;
  correctAnswers: number;
  wrongAnswers: number;
  correctStreak: number;
  averageResponseTimeMs: number;
  lastExerciseType?: ExerciseType;
  lastCorrect?: boolean;
  fsrsCard: Card;
  lastReviewedAt?: Date;
  nextReviewAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
export interface ExerciseSelection {
  word: WordModel;
  type: ExerciseType;
  variant: ExerciseVariant;
  reason: string;
  priority: number;
}
