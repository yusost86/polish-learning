import { describe, expect, it } from "vitest";

import { CATALOG_WORDS, DEFAULT_STUDENT_ID } from "../data/catalogSeed";
import { LearningEngine } from "./LearningEngine";
import { InMemoryLearningRepository } from "../repositories/InMemoryLearningRepository";
import { createInitialCard } from "./FsrsService";

describe("LearningEngine.deleteTopic", () => {
  it("removes all words for the topic and progress", async () => {
    const repository = new InMemoryLearningRepository(CATALOG_WORDS);
    const engine = new LearningEngine(repository);

    await repository.getOrCreateProgress(
      DEFAULT_STUDENT_ID,
      "airport",
      new Date(),
      createInitialCard,
    );

    const travelWordCount = CATALOG_WORDS.filter((word) => word.topicId === "travel").length;
    const result = await engine.deleteTopic(DEFAULT_STUDENT_ID, "travel");

    expect(result).toEqual({ topicId: "travel", deletedWordCount: travelWordCount });
    expect(await repository.getTopicWords("travel")).toHaveLength(0);
    expect(await repository.getAllWords()).toHaveLength(CATALOG_WORDS.length - travelWordCount);
    expect(await repository.getProgress(DEFAULT_STUDENT_ID, "airport")).toBeNull();
    expect((await repository.getTopicNames()).travel).toBeUndefined();
  });

  it("throws when topic does not exist", async () => {
    const repository = new InMemoryLearningRepository(CATALOG_WORDS);
    const engine = new LearningEngine(repository);

    await expect(engine.deleteTopic(DEFAULT_STUDENT_ID, "missing-topic")).rejects.toThrow(/not found/i);
  });
});
