import { CATALOG_WORDS, TOPIC_NAMES } from "../data/wordCatalog";
import { db } from "./database";

function toStoredWord(word: (typeof CATALOG_WORDS)[number]) {
  return {
    id: word.id,
    term: word.term,
    translation: word.translation,
    topicId: word.topicId,
  };
}

export async function seedCatalogIfEmpty(): Promise<void> {
  const existingWords = await db.words.toArray();
  const existingIds = new Set(existingWords.map((word) => word.id));

  if (existingWords.length === 0) {
    await db.words.bulkPut(CATALOG_WORDS.map(toStoredWord));
  } else {
    const missingWords = CATALOG_WORDS.filter((word) => !existingIds.has(word.id));
    if (missingWords.length > 0) {
      await db.words.bulkPut(missingWords.map(toStoredWord));
    }
  }

  await db.topics.bulkPut(
    Object.entries(TOPIC_NAMES).map(([id, name]) => ({ id, name })),
  );
}

export async function ensureTopicsSeeded(): Promise<void> {
  const topicCount = await db.topics.count();
  if (topicCount > 0) {
    return;
  }

  const words = await db.words.toArray();
  const topicIds = [...new Set(words.map((word) => word.topicId))];
  await db.topics.bulkPut(
    topicIds.map((id) => ({
      id,
      name: TOPIC_NAMES[id as keyof typeof TOPIC_NAMES] ?? id,
    })),
  );
}
