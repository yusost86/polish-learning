// src/learning/session.ts

import { db } from "../db/db";
import { getDueCards } from "./due-words";
import { addNewWords } from "./new-words";

import type { LearningSession } from "../domain/types";

export interface BuildSessionOptions {
  studentId: string;
  topicId?: string;
  subtopicId?: string;
  /** 'due' = only cards already due, 'new' = only fresh words, 'mixed' = both (default) */
  mode?: "due" | "new" | "mixed";
  maxBacklog?: number;
  newWordsLimit?: number;
}

export async function buildSession(options: BuildSessionOptions): Promise<LearningSession> {
  const { studentId, topicId, subtopicId, mode = "mixed", maxBacklog = 20, newWordsLimit = 10 } = options;

  let cards = await db.studentWords.where("studentId").equals(studentId).toArray();

  if (topicId || subtopicId) {
    const wordIds = new Set(
      (await db.words.toArray())
        .filter((w) => (subtopicId ? w.subtopicId === subtopicId : w.topicId === topicId))
        .map((w) => w.id),
    );
    cards = cards.filter((c) => wordIds.has(c.wordId));
  }

  const dueCards = getDueCards(cards);

  let newWords: LearningSession["newWords"] = [];
  let newCards: LearningSession["newCards"] = [];

  if (mode === "new" || (mode === "mixed" && dueCards.length <= maxBacklog)) {
    const result = await addNewWords(studentId, topicId, subtopicId, newWordsLimit);
    newWords = result.words;
    newCards = result.cards;
  }

  return {
    reviewCards: mode === "new" ? [] : dueCards,
    newCards,
    newWords,
  };
}
