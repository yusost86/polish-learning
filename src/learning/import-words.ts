// src/learning/import-words.ts

import { db } from "../db/db";

import type { Topic, Word, WordModelDTO } from "../domain/types";

export class ImportValidationError extends Error {}

export function parseWordModelJSON(raw: string): WordModelDTO[] {
  let data: unknown;

  try {
    data = JSON.parse(raw);
  } catch {
    throw new ImportValidationError("Не вдалося розпізнати JSON. Перевірте синтаксис.");
  }

  if (!Array.isArray(data) || data.length === 0) {
    throw new ImportValidationError("Очікується непорожній масив об'єктів.");
  }

  data.forEach((item, i) => {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof (item as any).pl !== "string" ||
      typeof (item as any).uk !== "string" ||
      !(item as any).pl.trim() ||
      !(item as any).uk.trim()
    ) {
      throw new ImportValidationError(
        `Елемент №${i + 1} має бути об'єктом з непорожніми текстовими полями "pl" і "uk".`,
      );
    }
    if ("topic" in (item as any) && typeof (item as any).topic !== "string") {
      throw new ImportValidationError(`Поле "topic" в елементі №${i + 1} має бути текстом.`);
    }
  });

  return data as WordModelDTO[];
}

export interface ImportResult {
  topicsCreated: number;
  wordsCreated: number;
}

/**
 * Adds a batch of words to the dictionary. Each word is grouped under its own
 * `topic` field if present, otherwise falls back to the given `setName`.
 * Existing topics with the same name are reused; duplicate pl/uk pairs inside
 * the same topic are skipped.
 */
export async function importWordSet(setName: string, entries: WordModelDTO[]): Promise<ImportResult> {
  const existingTopics = await db.topics.toArray();
  const topicByName = new Map<string, Topic>(existingTopics.map((t) => [t.name.toLowerCase(), t]));

  const existingWords = await db.words.toArray();
  const wordKey = (topicId: string, pl: string, uk: string) => `${topicId}::${pl.trim().toLowerCase()}::${uk.trim().toLowerCase()}`;
  const existingWordKeys = new Set(existingWords.map((w) => wordKey(w.topicId, w.foreignText, w.nativeText)));

  const now = new Date().toISOString();
  const newTopics: Topic[] = [];
  const newWords: Word[] = [];

  for (const entry of entries) {
    const topicName = (entry.topic && entry.topic.trim()) || setName.trim() || "Без теми";
    const key = topicName.toLowerCase();

    let topic = topicByName.get(key);
    if (!topic) {
      topic = { id: crypto.randomUUID(), name: topicName, createdAt: now };
      topicByName.set(key, topic);
      newTopics.push(topic);
    }

    const k = wordKey(topic.id, entry.pl, entry.uk);
    if (existingWordKeys.has(k)) {
      continue; // skip duplicates
    }
    existingWordKeys.add(k);

    newWords.push({
      id: crypto.randomUUID(),
      foreignText: entry.pl.trim(),
      nativeText: entry.uk.trim(),
      topicId: topic.id,
      importance: 1,
      exerciseTypes: ["FOREIGN_TO_NATIVE", "NATIVE_TO_FOREIGN"],
      createdAt: now,
    });
  }

  await db.transaction("rw", db.topics, db.words, async () => {
    if (newTopics.length) await db.topics.bulkAdd(newTopics);
    if (newWords.length) await db.words.bulkAdd(newWords);
  });

  return { topicsCreated: newTopics.length, wordsCreated: newWords.length };
}
