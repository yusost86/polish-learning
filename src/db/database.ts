import Dexie, { type EntityTable } from "dexie";

import type { WordState } from "../domain/enums/WordState";
import type { SkillProgress } from "../domain/models/SkillProgress";

export interface StoredWord {
  id: string;
  term: string;
  translation: string;
  topicId: string;
}

export interface StoredFsrsCard {
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_review?: string;
}

export interface StoredWordProgress {
  id: string;
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
  lastReviewedAt?: string;
  fsrsCard: StoredFsrsCard;
  createdAt: string;
  updatedAt: string;
}

export interface StoredTopicWave {
  id: string;
  studentId: string;
  topicId: string;
  unlockedWaveCount: number;
}

export class LearningDatabase extends Dexie {
  words!: EntityTable<StoredWord, "id">;
  studentWordProgress!: EntityTable<StoredWordProgress, "id">;
  topicWaves!: EntityTable<StoredTopicWave, "id">;

  constructor() {
    super("PolishLearning");
    this.version(1).stores({
      words: "id, topicId",
      studentWordProgress: "id, studentId, wordId, [studentId+wordId]",
      topicWaves: "id, studentId, topicId, [studentId+topicId]",
    });
  }
}

export const db = new LearningDatabase();
