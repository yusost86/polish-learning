import { CATALOG_WORDS, TOPIC_NAMES } from "../data/wordCatalog";
import { WordState } from "../domain/enums/WordState";
import type { Word } from "../domain/models/Word";
import type { StoredLearningWord, StoredTopic, StoredWord } from "./database";
import { db } from "./database";
import { learningWordStorageId } from "../repositories/progressMapper";

type StoredLanguage = StoredWord["language"];

const POLISH: StoredLanguage = "polish";
const UKRAINIAN: StoredLanguage = "ukrainian";

function ukrainianWordId(wordId: string): string {
  return `${wordId}-uk`;
}

function toStoredWordPair(word: Word): StoredWord[] {
  const ukId = ukrainianWordId(word.id);
  return [
    {
      id: word.id,
      term: word.term,
      partOfSpeech: "noun",
      language: POLISH,
      translation: [{ language: UKRAINIAN, wordId: ukId }],
    },
    {
      id: ukId,
      term: word.translation,
      partOfSpeech: "noun",
      language: UKRAINIAN,
      translation: [{ language: POLISH, wordId: word.id }],
    },
  ];
}

function createStoredLearningWord(word: Word, now: string): StoredLearningWord {
  return {
    id: learningWordStorageId(word.topicId, word.id),
    wordId: word.id,
    topicId: word.topicId,
    state: WordState.New,
    consecutiveCorrect: 0,
    createdAt: now,
    updatedAt: now,
    wordProgressEntries: [],
  };
}

function buildTopics(now: string): StoredTopic[] {
  const wordsByTopic = new Map<string, Word[]>();
  for (const word of CATALOG_WORDS) {
    const topicWords = wordsByTopic.get(word.topicId) ?? [];
    topicWords.push(word);
    wordsByTopic.set(word.topicId, topicWords);
  }

  return [...wordsByTopic.entries()].map(([topicId, words]) => ({
    id: topicId,
    name: TOPIC_NAMES[topicId as keyof typeof TOPIC_NAMES] ?? topicId,
    language: POLISH,
    wordProgress: words.map((word) => createStoredLearningWord(word, now)),
  }));
}

function isLegacyStoredWord(word: StoredWord | Record<string, unknown>): boolean {
  return "topicId" in word && !("language" in word);
}

function groupCatalogWordsByTopic(): Map<string, Word[]> {
  const wordsByTopic = new Map<string, Word[]>();
  for (const word of CATALOG_WORDS) {
    const topicWords = wordsByTopic.get(word.topicId) ?? [];
    topicWords.push(word);
    wordsByTopic.set(word.topicId, topicWords);
  }
  return wordsByTopic;
}

function normalizeStoredLearningWord(entry: StoredLearningWord): StoredLearningWord {
  return {
    ...entry,
    consecutiveCorrect:
      typeof entry.consecutiveCorrect === "number" && Number.isFinite(entry.consecutiveCorrect)
        ? entry.consecutiveCorrect
        : 0,
    wordProgressEntries: entry.wordProgressEntries ?? [],
  };
}

/** Repairs DB rows created before topic-embedded progress and split PL/UK words. */
export async function repairCatalogIfNeeded(): Promise<void> {
  const [topics, words] = await Promise.all([db.topics.toArray(), db.words.toArray()]);
  const now = new Date().toISOString();
  const totalProgressEntries = topics.reduce((sum, topic) => sum + (topic.wordProgress?.length ?? 0), 0);
  const hasLegacyWords = words.some((word) => isLegacyStoredWord(word));
  const hasBrokenTopics = topics.some((topic) => !Array.isArray(topic.wordProgress));
  const needsFullReseed =
    hasLegacyWords ||
    hasBrokenTopics ||
    (CATALOG_WORDS.length > 0 && words.length > 0 && totalProgressEntries === 0);

  if (needsFullReseed) {
    await db.transaction("rw", [db.words, db.topics], async () => {
      await db.words.clear();
      await db.topics.clear();
      await db.words.bulkPut(CATALOG_WORDS.flatMap(toStoredWordPair));
      await db.topics.bulkPut(buildTopics(now));
    });
    return;
  }

  for (const topic of topics) {
    const needsProgressRepair = (topic.wordProgress ?? []).some(
      (entry) =>
        typeof entry.consecutiveCorrect !== "number" ||
        !Number.isFinite(entry.consecutiveCorrect) ||
        entry.wordProgressEntries == null,
    );

    if (needsProgressRepair) {
      await db.topics.put({
        ...topic,
        wordProgress: (topic.wordProgress ?? []).map(normalizeStoredLearningWord),
      });
    }
  }

  for (const [topicId, topicWords] of groupCatalogWordsByTopic()) {
    const topic = await db.topics.get(topicId);
    if (!topic) {
      await db.topics.put({
        id: topicId,
        name: TOPIC_NAMES[topicId as keyof typeof TOPIC_NAMES] ?? topicId,
        language: POLISH,
        wordProgress: topicWords.map((word) => createStoredLearningWord(word, now)),
      });
      continue;
    }

    const existingWordIds = new Set(topic.wordProgress.map((entry) => entry.wordId));
    const missingWords = topicWords.filter((word) => !existingWordIds.has(word.id));
    if (missingWords.length === 0) {
      continue;
    }

    await db.topics.put({
      ...topic,
      language: topic.language ?? POLISH,
      wordProgress: [
        ...topic.wordProgress,
        ...missingWords.map((word) => createStoredLearningWord(word, now)),
      ],
    });
  }

  const existingIds = new Set(words.map((word) => word.id));
  const missingCatalogWords = CATALOG_WORDS.filter((word) => !existingIds.has(word.id));
  if (missingCatalogWords.length > 0) {
    await db.words.bulkPut(missingCatalogWords.flatMap(toStoredWordPair));
  }
}

export async function seedCatalogIfEmpty(): Promise<void> {
  const now = new Date().toISOString();
  const existingWords = await db.words.toArray();
  const existingIds = new Set(existingWords.map((word) => word.id));

  if (existingWords.length === 0) {
    await db.words.bulkPut(CATALOG_WORDS.flatMap(toStoredWordPair));
    await db.topics.bulkPut(buildTopics(now));
    return;
  }

  const missingWords = CATALOG_WORDS.filter((word) => !existingIds.has(word.id));
  if (missingWords.length > 0) {
    await db.words.bulkPut(missingWords.flatMap(toStoredWordPair));
  }

  for (const word of missingWords) {
    const topic = await db.topics.get(word.topicId);
    if (!topic) {
      await db.topics.put({
        id: word.topicId,
        name: TOPIC_NAMES[word.topicId as keyof typeof TOPIC_NAMES] ?? word.topicId,
        language: POLISH,
        wordProgress: [createStoredLearningWord(word, now)],
      });
      continue;
    }

    const hasProgress = topic.wordProgress.some((entry) => entry.wordId === word.id);
    if (!hasProgress) {
      await db.topics.put({
        ...topic,
        wordProgress: [...topic.wordProgress, createStoredLearningWord(word, now)],
      });
    }
  }
}

export async function ensureTopicsSeeded(): Promise<void> {
  const topics = await db.topics.toArray();
  if (topics.length === 0) {
    await db.topics.bulkPut(buildTopics(new Date().toISOString()));
  }
}
