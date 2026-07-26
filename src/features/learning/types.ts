import type { Card } from "ts-fsrs";

export interface Topic {
  id: string;
  name: string;
  order: number;
  newWordsPerCycle: number;
}

export interface Subtopic {
  id: string;
  topicId: string;
  name: string;
  order: number;
}

export interface Word {
  id: string;
  term: string;
  translation: string;
  topicId: string;
  subtopicId?: string;
  priority?: number;
}

export type WordState = "new" | "introduced" | "learning" | "consolidating" | "mature";
export interface SkillScores { recognition: number; recall: number; production: number; context: number; }
export type ExerciseType = keyof SkillScores;
export type ExerciseVariant = "multiple-choice" | "reverse-multiple-choice" | "typing" | "sentence-completion" | "translation" | "mixed-recall";
export type FsrsGrade = "again" | "hard" | "good" | "easy";

export interface WordLearningStats {
  wordId: string; studentId: string; topicId: string; subtopicId?: string;
  state: WordState; skills: SkillScores; mastery: number; weakestSkill: ExerciseType;
  attempts: number; correctAnswers: number; wrongAnswers: number; correctStreak: number;
  averageResponseTimeMs: number; lastExerciseType?: ExerciseType; lastCorrect?: boolean;
  fsrsCard: Card; lastReviewedAt?: Date; nextReviewAt?: Date; createdAt: Date; updatedAt: Date;
}

export interface ReviewLog {
  id: string; studentId: string; wordId: string; topicId: string;
  exerciseType: ExerciseType; exerciseVariant: ExerciseVariant; correct: boolean;
  responseTimeMs: number; fsrsGrade: FsrsGrade; createdAt: Date;
}

export interface TopicProgress {
  topicId: string; totalWords: number; newWords: number; introducedWords: number;
  learningWords: number; consolidatingWords: number; matureWords: number;
  averageMastery: number; completed: boolean;
}

export interface ExerciseSelection { word: Word; type: ExerciseType; variant: ExerciseVariant; reason: string; priority: number; }
export interface LearningSession { studentId: string; topicId?: string; newWordsLimit: number; sessionLimit: number; }
