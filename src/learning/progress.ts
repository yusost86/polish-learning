// src/learning/progress.ts

import { State } from "ts-fsrs";

import { db } from "../db/db";

import type { GlobalProgressSummary, ReviewEvent, StudentWord, WordProgressRecord } from "../domain/types";

export async function loadProgressRecords(studentId: string): Promise<WordProgressRecord[]> {
  const [words, studentWords, topics] = await Promise.all([
    db.words.toArray(),
    db.studentWords.where("studentId").equals(studentId).toArray(),
    db.topics.toArray(),
  ]);

  const topicNameById = new Map(topics.map((t) => [t.id, t.name]));
  const studentWordByWordId = new Map(studentWords.map((sw) => [sw.wordId, sw]));

  return words.map((word) => ({
    word,
    studentWord: studentWordByWordId.get(word.id),
    topicName: topicNameById.get(word.topicId) ?? "Без теми",
  }));
}

/** A word counts as "learned" once FSRS has moved it past initial learning
 * and its retrievability/stability is comfortably high. */
export function isLearned(sw: StudentWord | undefined): boolean {
  if (!sw) return false;
  if (sw.learningProgress) return sw.learningProgress.state === "mature";
  // Compatibility for records created before the mastery model.
  return sw.fsrsCard.state === State.Review && sw.fsrsCard.stability >= 21;
}


export function isDue(sw: StudentWord | undefined, now: Date = new Date()): boolean {
  if (!sw) return false;
  return new Date(sw.learningProgress?.nextReviewAt ?? sw.fsrsCard.due) <= now;
}

export function toRepeate(sw: StudentWord | undefined ): boolean {
  if (!sw) return false;
  return sw.learningProgress?.state !== 'mature' && sw.learningProgress?.state !== 'new'
}
export function computeGlobalSummary(records: WordProgressRecord[]): GlobalProgressSummary {
  const totalUniqueWords = records.length;
  const learnedWordsCount = records.filter((r) => isLearned(r.studentWord)).length;
  const newWordsCount = records.filter((r) => !r.studentWord || r.studentWord.learningProgress?.state === "new").length;
  const dueNowCount = records.filter((r) => isDue(r.studentWord)).length;

  return { totalUniqueWords, newWordsCount, learnedWordsCount, dueNowCount };
}


/** Star rating 1-5 derived from FSRS stability (days), used for a quick visual cue. */
export function starLevel(sw: StudentWord | undefined): number {
  if (!sw) return 0;
  const s = sw.fsrsCard.stability;
  if (s >= 90) return 5;
  if (s >= 30) return 4;
  if (s >= 10) return 3;
  if (s >= 3) return 2;
  return 1;
}

export interface AccuracyStats {
  correct: number;
  incorrect: number;
  accuracyPct: number;
  averageStreak: number;
  longestStreak: number;
}

export async function computeAccuracyStats(studentId: string): Promise<AccuracyStats> {
  const studentWords = await db.studentWords.where("studentId").equals(studentId).toArray();

  const correct = studentWords.reduce((sum, sw) => sum + sw.correctCount, 0);
  const incorrect = studentWords.reduce((sum, sw) => sum + sw.incorrectCount, 0);
  const total = correct + incorrect;

  const longestStreak = studentWords.reduce((max, sw) => Math.max(max, sw.consecutiveCorrect), 0);
  const averageStreak = studentWords.length
    ? studentWords.reduce((sum, sw) => sum + sw.consecutiveCorrect, 0) / studentWords.length
    : 0;

  return {
    correct,
    incorrect,
    accuracyPct: total > 0 ? Math.round((correct / total) * 100) : 0,
    averageStreak: Math.round(averageStreak * 10) / 10,
    longestStreak,
  };
}

export async function getReviewEventsForWord(wordId: string): Promise<ReviewEvent[]> {
  return db.reviewEvents.where("wordId").equals(wordId).sortBy("timestamp");
}
