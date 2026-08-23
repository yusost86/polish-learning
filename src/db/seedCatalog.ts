import { CATALOG_WORDS } from "../data/wordCatalog";
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
}
