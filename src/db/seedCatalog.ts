import { CATALOG_WORDS, TOPIC_NAMES } from "../data/wordCatalog";
import { db } from "./database";

export async function seedCatalogIfEmpty(): Promise<void> {
  const count = await db.words.count();
  if (count > 0) {
    return;
  }

  await db.words.bulkPut(
    CATALOG_WORDS.map((word) => ({
      id: word.id,
      term: word.term,
      translation: word.translation,
      topicId: word.topicId,
    })),
  );

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
