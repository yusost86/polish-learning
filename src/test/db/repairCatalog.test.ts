import { beforeEach, describe, expect, it } from "vitest";

import { CATALOG_WORDS } from "../../data/catalogSeed";
import { db } from "../../db/database";
import { repairCatalogIfNeeded } from "../../db/seedCatalog";
import { DexieLearningRepository } from "../../repositories/DexieLearningRepository";

describe("repairCatalogIfNeeded", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it("re-seeds legacy words that still use topicId on the word row", async () => {
    await db.words.bulkPut(
      CATALOG_WORDS.slice(0, 5).map((word) => ({
        id: word.id,
        term: word.term,
        translation: word.translation,
        topicId: word.topicId,
      })) as never,
    );
    await db.topics.bulkPut([
      { id: "travel", name: "Подорожі" },
    ] as never);

    await repairCatalogIfNeeded();

    const repository = new DexieLearningRepository();
    const words = await repository.getAllWords();
    expect(words.length).toBeGreaterThan(0);
    expect(await db.topics.get("travel")).toMatchObject({
      wordProgress: expect.arrayContaining([
        expect.objectContaining({ wordId: "airport", topicId: "travel" }),
      ]),
    });
  });
});
