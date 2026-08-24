import { beforeEach, describe, expect, it } from "vitest";

import { CATALOG_WORDS } from "../data/catalogSeed";
import { db } from "./database";
import { seedCatalogIfEmpty } from "./seedCatalog";

describe("seedCatalogIfEmpty", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it("seeds the full default catalog on first launch", async () => {
    await seedCatalogIfEmpty();

    expect(await db.words.count()).toBe(CATALOG_WORDS.length);
    expect(await db.topics.count()).toBe(3);
  });

  it("adds missing default words without wiping existing catalog", async () => {
    await db.words.bulkPut(
      CATALOG_WORDS.slice(0, 27).map((word) => ({
        id: word.id,
        term: word.term,
        translation: word.translation,
        topicId: word.topicId,
      })),
    );

    await seedCatalogIfEmpty();

    expect(await db.words.count()).toBe(CATALOG_WORDS.length);
  });
});
