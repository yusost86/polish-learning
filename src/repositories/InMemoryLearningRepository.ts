import type { Card } from "ts-fsrs";

import type { Word } from "../domain/models/Word";
import { createEmptyWordProgress, type WordProgress } from "../domain/models/WordProgress";
import type { LearningDataRepository } from "./WordProgressRepository";
import { TOPIC_NAMES } from "../data/wordCatalog";

export class InMemoryLearningRepository implements LearningDataRepository {
  private readonly words = new Map<string, Word>();
  private readonly progress = new Map<string, WordProgress>();
  private readonly waveCounts = new Map<string, number>();
  private readonly topicNames = new Map<string, string>();

  constructor(words: Word[]) {
    for (const word of words) {
      this.words.set(word.id, word);
    }
    for (const [id, name] of Object.entries(TOPIC_NAMES)) {
      this.topicNames.set(id, name);
    }
  }

  private progressKey(studentId: string, wordId: string): string {
    return `${studentId}:${wordId}`;
  }

  private waveKey(studentId: string, topicId: string): string {
    return `${studentId}:${topicId}`;
  }

  async getProgress(studentId: string, wordId: string): Promise<WordProgress | null> {
    return this.progress.get(this.progressKey(studentId, wordId)) ?? null;
  }

  async getStudentProgress(studentId: string, topicId?: string): Promise<WordProgress[]> {
    const all = [...this.progress.values()].filter((p) => p.studentId === studentId);
    if (!topicId) {
      return all;
    }
    const topicWordIds = new Set(
      [...this.words.values()].filter((w) => w.topicId === topicId).map((w) => w.id),
    );
    return all.filter((p) => topicWordIds.has(p.wordId));
  }

  async getTopicWords(topicId: string): Promise<Word[]> {
    return [...this.words.values()].filter((w) => w.topicId === topicId);
  }

  async getAllWords(): Promise<Word[]> {
    return [...this.words.values()];
  }

  async save(progress: WordProgress): Promise<void> {
    this.progress.set(this.progressKey(progress.studentId, progress.wordId), progress);
  }

  async saveMany(progressList: WordProgress[]): Promise<void> {
    for (const progress of progressList) {
      await this.save(progress);
    }
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
    return this.waveCounts.get(this.waveKey(studentId, topicId)) ?? 1;
  }

  async setUnlockedWaveCount(studentId: string, topicId: string, count: number): Promise<void> {
    this.waveCounts.set(this.waveKey(studentId, topicId), count);
  }

  seedProgress(progress: WordProgress): void {
    this.progress.set(this.progressKey(progress.studentId, progress.wordId), progress);
  }

  async getTopicNames(): Promise<Record<string, string>> {
    return Object.fromEntries(this.topicNames.entries());
  }

  async saveTopicNames(topicNames: Record<string, string>): Promise<void> {
    for (const [id, name] of Object.entries(topicNames)) {
      this.topicNames.set(id, name);
    }
  }

  async addWords(words: Word[]): Promise<number> {
    for (const word of words) {
      this.words.set(word.id, word);
    }
    return words.length;
  }

  async importCatalogBatch(words: Word[], topicNames: Record<string, string>): Promise<number> {
    for (const word of words) {
      this.words.set(word.id, word);
    }
    for (const [id, name] of Object.entries(topicNames)) {
      this.topicNames.set(id, name);
    }
    return words.length;
  }
}
