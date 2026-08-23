import type { Card } from "ts-fsrs";

import type { Word } from "../domain/models/Word";
import type { WordProgress } from "../domain/models/WordProgress";

export interface WordProgressRepository {
  getProgress(studentId: string, wordId: string): Promise<WordProgress | null>;
  getStudentProgress(studentId: string, topicId?: string): Promise<WordProgress[]>;
  getTopicWords(topicId: string): Promise<Word[]>;
  getAllWords(): Promise<Word[]>;
  save(progress: WordProgress): Promise<void>;
  saveMany(progressList: WordProgress[]): Promise<void>;
  getOrCreateProgress(studentId: string, wordId: string, now: Date, createCard: (now: Date) => Card): Promise<WordProgress>;
}

export interface TopicProgressRepository {
  getUnlockedWaveCount(studentId: string, topicId: string): Promise<number>;
  setUnlockedWaveCount(studentId: string, topicId: string, count: number): Promise<void>;
}

export interface LearningDataRepository extends WordProgressRepository, TopicProgressRepository {}
