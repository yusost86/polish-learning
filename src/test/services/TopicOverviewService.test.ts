import { describe, expect, it } from "vitest";

import { WordState } from "../../domain/enums/WordState";
import {
  createEmptyLearningWord,
  type LearningWord,
} from "../../domain/models/LearningWordModel";
import type { Word } from "../../domain/models/Word";
import type { ILearningWordRepository } from "../../repositories/ILearningWordRepository";
import type { ITopicRepository } from "../../repositories/ITopicRepository";
import { buildTopicOverview } from "../../services/TopicOverviewService";

const TOPIC_ID = "food";
const NOW = new Date("2026-01-01T00:00:00.000Z");

function word(wordId: string): Word {
  return { id: wordId, term: wordId, translation: wordId, topicId: TOPIC_ID };
}

function progress(wordId: string, state: WordState): LearningWord {
  const entry = createEmptyLearningWord(wordId, TOPIC_ID, NOW);
  entry.state = state;
  return entry;
}

function createMocks(words: Word[], progressList: LearningWord[]) {
  const topicRepository: ITopicRepository = {
    getTopicNames: async () => ({}),
    getAllWords: async () => words,
    addWords: async () => 0,
    saveTopicNames: async () => undefined,
    importCatalogBatch: async () => 0,
    deleteTopic: async () => ({ topicId: TOPIC_ID, deletedWordCount: 0 }),
  };

  const learningWordRepository: ILearningWordRepository = {
    getLearningWordsByTopic: async () => progressList,
    save: async () => undefined,
    getLearningWords: async () => progressList,
  };

  return { topicRepository, learningWordRepository };
}

describe("buildTopicOverview", () => {
  it("includes Mature and Relearning in masteredCount", async () => {
    const words = [word("w1"), word("w2"), word("w3")];
    const { topicRepository, learningWordRepository } = createMocks(words, [
      progress("w1", WordState.Mature),
      progress("w2", WordState.Relearning),
      progress("w3", WordState.Learning),
    ]);

    const overview = await buildTopicOverview(
      topicRepository,
      learningWordRepository,
      TOPIC_ID,
    );

    expect(overview.topicProgress.masteredCount).toBe(2);
  });

  it("does not include Relearning in learningCount", async () => {
    const words = [word("w1"), word("w2"), word("w3"), word("w4")];
    const { topicRepository, learningWordRepository } = createMocks(words, [
      progress("w1", WordState.Relearning),
      progress("w2", WordState.Learning),
      progress("w3", WordState.Consolidating),
      progress("w4", WordState.New),
    ]);

    const overview = await buildTopicOverview(
      topicRepository,
      learningWordRepository,
      TOPIC_ID,
    );

    expect(overview.topicProgress.learningCount).toBe(2);
    expect(overview.topicProgress.masteredCount).toBe(1);
    expect(overview.topicProgress.newCount).toBe(1);
  });
});
