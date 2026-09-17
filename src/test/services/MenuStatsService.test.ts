import { describe, expect, it } from "vitest";

import { ExerciseType } from "../../domain/enums/ExerciseType";
import { WordState } from "../../domain/enums/WordState";
import {
  createEmptyLearningWord,
  type LearningWord,
} from "../../domain/models/LearningWordModel";
import type { Word } from "../../domain/models/Word";
import type { ILearningWordRepository } from "../../repositories/ILearningWordRepository";
import type { ITopicRepository } from "../../repositories/ITopicRepository";
import { calculateMenuStats } from "../../services/MenuStatsService";

const TOPIC_ID = "food";
const NOW = new Date("2026-01-01T00:00:00.000Z");

function word(wordId: string): Word {
  return { id: wordId, term: wordId, translation: wordId, topicId: TOPIC_ID };
}

function progress(wordId: string, state: WordState): LearningWord {
  const entry = createEmptyLearningWord(wordId, TOPIC_ID, NOW);
  entry.state = state;
  entry.wordProgressEntries.push({
    isCorrect: true,
    createdAt: NOW,
    exercise: ExerciseType.Flashcard,
    state,
  });
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

describe("calculateMenuStats", () => {
  it("counts Mature words as learned", async () => {
    const words = [word("w1")];
    const { topicRepository, learningWordRepository } = createMocks(
      words,
      [progress("w1", WordState.Mature)],
    );

    const stats = await calculateMenuStats(learningWordRepository, topicRepository);

    expect(stats.learnedWordsCount).toBe(1);
    expect(stats.topics[0]?.learned).toBe(1);
  });

  it("counts Relearning words as learned", async () => {
    const words = [word("w1")];
    const { topicRepository, learningWordRepository } = createMocks(
      words,
      [progress("w1", WordState.Relearning)],
    );

    const stats = await calculateMenuStats(learningWordRepository, topicRepository);

    expect(stats.learnedWordsCount).toBe(1);
    expect(stats.topics[0]?.learned).toBe(1);
  });

  it("does not count Consolidating, Learning, or New as learned", async () => {
    const words = [word("w1"), word("w2"), word("w3")];
    const { topicRepository, learningWordRepository } = createMocks(words, [
      progress("w1", WordState.Consolidating),
      progress("w2", WordState.Learning),
      progress("w3", WordState.New),
    ]);

    const stats = await calculateMenuStats(learningWordRepository, topicRepository);

    expect(stats.learnedWordsCount).toBe(0);
    expect(stats.topics[0]?.learned).toBe(0);
  });

  it("counts Relearning words as due for review", async () => {
    const words = [word("w1")];
    const { topicRepository, learningWordRepository } = createMocks(
      words,
      [progress("w1", WordState.Relearning)],
    );

    const stats = await calculateMenuStats(learningWordRepository, topicRepository);

    expect(stats.dueNowCount).toBe(1);
    expect(stats.topics[0]?.due).toBe(1);
  });
});
