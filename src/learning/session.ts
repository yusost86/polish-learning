// src/learning/session.ts

import { db } from "../db/db";
import { getDueCards } from "./due-words";
import { addNewWords } from "./new-words";
import { buildReviewQueue } from "../features/learning/queue/reviewQueue";
import { canUnlockNextWave } from "../features/learning/topic/topicEngine";

import type { LearningSession, StudentWord, Word } from "../domain/types";
import type { Word as LearningWord, WordLearningStats } from "../features/learning/types";

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
  cards = await migrateLearningProgress(cards);
  const allWords = await db.words.toArray();

  if (topicId || subtopicId) {
    const wordIds = new Set(
      allWords
        .filter((w) => subtopicId ? w.subtopicId === subtopicId : belongsToTopic(w, topicId!))
        .map((w) => w.id),
    );
    cards = cards.filter((c) => wordIds.has(c.wordId));
  }

  const dueCards = getDueCards(cards);

  let newWords: LearningSession["newWords"] = [];
  let newCards: LearningSession["newCards"] = [];

  const topicCards = topicId
    ? cards.filter((card) => {
      const word = allWords.find((candidate) => candidate.id === card.wordId);
      return word ? belongsToTopic(word, topicId) : false;
    })
    : [];
  const canOpenNewWords = !topicId || topicCards.length === 0 || canUnlockNextWave(
    topicCards.flatMap((card) => {
      const word = allWords.find((candidate) => candidate.id === card.wordId);
      return word ? [toLearningStats(card, word)] : [];
    }),
  );

  if (canOpenNewWords && (mode === "new" || (mode === "mixed" && dueCards.length <= maxBacklog))) {
    const result = await addNewWords(studentId, topicId, subtopicId, newWordsLimit);
    newWords = result.words;
    newCards = result.cards;
  }

  let reviewCards = mode === "new" ? [] : prioritizeCards(dueCards, allWords, maxBacklog);
  let aheadOfSchedule = false;

  // Nothing new to learn and nothing due yet: rather than showing an empty
  // session, offer the words that are coming up soonest so the person can
  // still practice something.
  if (reviewCards.length === 0 && newCards.length === 0 && cards.length > 0) {
    reviewCards = prioritizeCards(cards, allWords, newWordsLimit);
    aheadOfSchedule = reviewCards.length > 0;
  }

  return {
    reviewCards,
    newCards,
    newWords,
    aheadOfSchedule,
  };
}

function belongsToTopic(word: Word, topicId: string): boolean {
  return word.topicId === topicId || word.topicIds?.includes(topicId) === true;
}

async function migrateLearningProgress(cards: StudentWord[]): Promise<StudentWord[]> {
  const migrated = cards.map((card) => card.learningProgress ? card : {
    ...card,
    learningProgress: {
      skills: { recognition: 0, recall: 0, production: 0, context: 0 }, mastery: 0, weakestSkill: "recognition" as const,
      state: "new" as const, attempts: 0, correctAnswers: 0, wrongAnswers: 0, correctStreak: 0, averageResponseTimeMs: 0,
    },
  });
  const changed = migrated.filter((card, index) => card !== cards[index]);
  if (changed.length) await db.studentWords.bulkPut(changed);
  return migrated;
}

function prioritizeCards(cards: StudentWord[], allWords: Word[], limit: number): StudentWord[] {
  const cardByWordId = new Map(cards.map((card) => [card.wordId, card]));
  const words = allWords.filter((word) => cardByWordId.has(word.id));
  const statsMap = new Map(words.map((word) => {
    const card = cardByWordId.get(word.id)!;
    return [word.id, toLearningStats(card, word)] as const;
  }));

  return buildReviewQueue(words.map(toLearningWord), statsMap, limit)
    .map((item) => cardByWordId.get(item.word.id)!)
}

function toLearningWord(word: Word): LearningWord {
  return { id: word.id, term: word.foreignText, translation: word.nativeText, topicId: word.topicId, subtopicId: word.subtopicId, priority: word.importance };
}

function toLearningStats(card: StudentWord, word: Word): WordLearningStats {
  const progress = card.learningProgress ?? {
    skills: { recognition: 0, recall: 0, production: 0, context: 0 }, mastery: 0, weakestSkill: "recognition" as const,
    state: "new" as const, attempts: 0, correctAnswers: 0, wrongAnswers: 0, correctStreak: 0, averageResponseTimeMs: 0,
  };
  const createdAt = new Date(card.createdAt);
  const updatedAt = new Date(card.updatedAt);
  return {
    wordId: card.wordId, studentId: card.studentId, topicId: word.topicId, subtopicId: word.subtopicId,
    state: progress.state, skills: progress.skills, mastery: progress.mastery, weakestSkill: progress.weakestSkill,
    attempts: progress.attempts, correctAnswers: progress.correctAnswers, wrongAnswers: progress.wrongAnswers,
    correctStreak: progress.correctStreak, averageResponseTimeMs: progress.averageResponseTimeMs,
    lastExerciseType: progress.lastExerciseType, lastCorrect: progress.lastCorrect, fsrsCard: card.fsrsCard,
    lastReviewedAt: progress.lastReviewedAt ? new Date(progress.lastReviewedAt) : undefined,
    nextReviewAt: progress.nextReviewAt ? new Date(progress.nextReviewAt) : card.fsrsCard.due,
    createdAt: Number.isNaN(createdAt.getTime()) ? new Date() : createdAt,
    updatedAt: Number.isNaN(updatedAt.getTime()) ? new Date() : updatedAt,
  };
}
