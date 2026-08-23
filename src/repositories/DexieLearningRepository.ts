import type { Card } from "ts-fsrs";

import { db } from "../db/database";
import { ensureTopicsSeeded, seedCatalogIfEmpty } from "../db/seedCatalog";
import type { Word } from "../domain/models/Word";
import { createEmptyWordProgress, type WordProgress } from "../domain/models/WordProgress";
import type { LearningDataRepository } from "./WordProgressRepository";
import {
  deserializeWordProgress,
  progressStorageId,
  serializeWordProgress,
  topicWaveStorageId,
} from "./progressMapper";

export class DexieLearningRepository implements LearningDataRepository {
  async initialize(): Promise<void> {
    await seedCatalogIfEmpty();
    await ensureTopicsSeeded();
  }

  async getProgress(studentId: string, wordId: string): Promise<WordProgress | null> {
    const stored = await db.studentWordProgress.get(progressStorageId(studentId, wordId));
    return stored ? deserializeWordProgress(stored) : null;
  }

  async getStudentProgress(studentId: string, topicId?: string): Promise<WordProgress[]> {
    const allStored = await db.studentWordProgress.where("studentId").equals(studentId).toArray();
    const all = allStored.map(deserializeWordProgress);
    if (!topicId) {
      return all;
    }
    const topicWordIds = new Set((await this.getTopicWords(topicId)).map((w) => w.id));
    return all.filter((p) => topicWordIds.has(p.wordId));
  }

  async getTopicWords(topicId: string): Promise<Word[]> {
    return db.words.where("topicId").equals(topicId).toArray();
  }

  async getAllWords(): Promise<Word[]> {
    return db.words.toArray();
  }

  async save(progress: WordProgress): Promise<void> {
    await db.studentWordProgress.put(serializeWordProgress(progress));
  }

  async saveMany(progressList: WordProgress[]): Promise<void> {
    await db.studentWordProgress.bulkPut(progressList.map(serializeWordProgress));
  }

  async getOrCreateProgress(
    studentId: string,
    wordId: string,
    now: Date,
    createCard: (now: Date) => Card,
  ): Promise<WordProgress> {
    const existing = await this.getProgress(studentId, wordId);
    if (existing) {
      return existing;
    }
    const created = createEmptyWordProgress(studentId, wordId, now, createCard(now));
    await this.save(created);
    return created;
  }

  async getUnlockedWaveCount(studentId: string, topicId: string): Promise<number> {
    const stored = await db.topicWaves.get(topicWaveStorageId(studentId, topicId));
    return stored?.unlockedWaveCount ?? 1;
  }

  async setUnlockedWaveCount(studentId: string, topicId: string, count: number): Promise<void> {
    await db.topicWaves.put({
      id: topicWaveStorageId(studentId, topicId),
      studentId,
      topicId,
      unlockedWaveCount: count,
    });
  }

  async getTopicNames(): Promise<Record<string, string>> {
    const topics = await db.topics.toArray();
    const names: Record<string, string> = {};
    for (const topic of topics) {
      names[topic.id] = topic.name;
    }
    return names;
  }

  async saveTopicNames(topicNames: Record<string, string>): Promise<void> {
    await db.topics.bulkPut(
      Object.entries(topicNames).map(([id, name]) => ({ id, name })),
    );
  }

  async addWords(words: Word[]): Promise<number> {
    if (words.length === 0) {
      return 0;
    }
    await db.words.bulkPut(
      words.map((word) => ({
        id: word.id,
        term: word.term,
        translation: word.translation,
        topicId: word.topicId,
      })),
    );
    return words.length;
  }

  async importCatalogBatch(words: Word[], topicNames: Record<string, string>): Promise<number> {
    if (words.length === 0 && Object.keys(topicNames).length === 0) {
      return 0;
    }

    await db.transaction("rw", [db.words, db.topics], async () => {
      if (words.length > 0) {
        await db.words.bulkPut(
          words.map((word) => ({
            id: word.id,
            term: word.term,
            translation: word.translation,
            topicId: word.topicId,
          })),
        );
      }
      if (Object.keys(topicNames).length > 0) {
        await db.topics.bulkPut(
          Object.entries(topicNames).map(([id, name]) => ({ id, name })),
        );
      }
    });

    return words.length;
  }
}
