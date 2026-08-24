import { describe, expect, it } from "vitest";

import { CATALOG_WORDS, INITIAL_TOPIC_WORD_COUNTS, TOPIC_NAMES } from "./catalogSeed";

describe("catalogSeed", () => {
  it("seeds three topics with the required initial word counts", () => {
    expect(Object.keys(TOPIC_NAMES)).toHaveLength(3);

    for (const [topicId, expectedCount] of Object.entries(INITIAL_TOPIC_WORD_COUNTS)) {
      const actualCount = CATALOG_WORDS.filter((word) => word.topicId === topicId).length;
      expect(actualCount).toBe(expectedCount);
    }

    expect(CATALOG_WORDS).toHaveLength(47);
  });
});
