// src/learning/new-words.ts

import { db } from "../db/db";
import { createStudentWord } from "../fsrs/create-card";

import type { StudentWord, Word } from "../domain/types";

export interface NewWordsResult {
  words: Word[];
  cards: StudentWord[];
}

export async function addNewWords(
  studentId: string,
  topicId?: string,
  subtopicId?: string,
  limit: number = 10,
): Promise<NewWordsResult> {
  const existing = await db.studentWords.where("studentId").equals(studentId).toArray();

  const knownIds = new Set(existing.map((x) => x.wordId));

  let words = await db.words.toArray();

  words = words.filter((word) => !knownIds.has(word.id));

  if (subtopicId) {
    words = words.filter((word) => word.subtopicId === subtopicId);
  } else if (topicId) {
    words = words.filter((word) => word.topicId === topicId || word.topicIds?.includes(topicId) === true);
  }

  words = words.sort((a, b) => b.importance - a.importance).slice(0, limit);

  const cards = words.map((word) => createStudentWord(studentId, word.id));

  if (cards.length > 0) {
    await db.transaction("rw", db.studentWords, async () => {
      await db.studentWords.bulkAdd(cards);
    });
  }

  return { words, cards };
}
