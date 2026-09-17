import { beforeEach, describe, expect, it } from "vitest";

import { CATALOG_WORDS } from "../../data/catalogSeed";
import { db } from "../../db/database";
import { seedCatalogIfEmpty } from "../../db/seedCatalog";

describe("seedCatalogIfEmpty", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it("seeds the full default catalog on first launch", async () => {
    await seedCatalogIfEmpty();

    expect(await db.words.count()).toBe(CATALOG_WORDS.length * 2);
    expect(await db.topics.count()).toBe(3);
  });

  it("adds missing default words without wiping existing catalog", async () => {
    await db.words.bulkPut(
      CATALOG_WORDS.slice(0, 27).flatMap((word) => [
        {
          id: word.id,
          term: word.term,
          partOfSpeech: "noun" as const,
          language: "polish" as const,
          translation: [{ language: "ukrainian" as const, wordId: `${word.id}-uk` }],
        },
        {
          id: `${word.id}-uk`,
          term: word.translation,
          partOfSpeech: "noun" as const,
          language: "ukrainian" as const,
          translation: [{ language: "polish" as const, wordId: word.id }],
        },
      ]),
    );

    await seedCatalogIfEmpty();

    expect(await db.words.count()).toBe(CATALOG_WORDS.length * 2);
  });
});
