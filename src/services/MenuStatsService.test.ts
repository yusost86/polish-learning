import { describe, expect, it } from "vitest";

import { WordState } from "../domain/enums/WordState";
import { createEmptyWordProgress } from "../domain/models/WordProgress";
import { InMemoryLearningRepository } from "../repositories/InMemoryLearningRepository";
import { createInitialCard } from "./FsrsService";
import { calculateMenuStats } from "./MenuStatsService";
import {
  ALL_SCENARIO_WORDS,
  SCENARIO_NOW,
  SCENARIO_STUDENT_ID,
  TRAVEL_WORDS,
} from "../test/fixtures/scenarioWords";

describe("MenuStatsService", () => {
  it("counts all unlocked words as new on cold start", async () => {
    const repo = new InMemoryLearningRepository(ALL_SCENARIO_WORDS);
    const stats = await calculateMenuStats(repo, SCENARIO_STUDENT_ID, SCENARIO_NOW);

    expect(stats.totalUniqueWords).toBe(ALL_SCENARIO_WORDS.length);
    expect(stats.newWordsCount).toBe(ALL_SCENARIO_WORDS.length);
    expect(stats.learnedWordsCount).toBe(0);
    expect(stats.dueNowCount).toBe(0);
    expect(stats.topics).toHaveLength(3);
  });

  it("counts learnable words as New and Learning only", async () => {
    const repo = new InMemoryLearningRepository(ALL_SCENARIO_WORDS);
    const now = SCENARIO_NOW;

    const learning = createEmptyWordProgress(SCENARIO_STUDENT_ID, "airport", now, createInitialCard(now));
    learning.state = WordState.Learning;
    learning.totalAttempts = 2;
    learning.recognition.mastery = 0.3;
    repo.seedProgress(learning);

    const consolidating = createEmptyWordProgress(
      SCENARIO_STUDENT_ID,
      "boarding-pass",
      now,
      createInitialCard(now),
    );
    consolidating.state = WordState.Consolidating;
    consolidating.totalAttempts = 3;
    consolidating.recognition.mastery = 0.5;
    consolidating.recall.mastery = 0.45;
    consolidating.production.mastery = 0.4;
    consolidating.context.mastery = 0.35;
    repo.seedProgress(consolidating);

    const stats = await calculateMenuStats(repo, SCENARIO_STUDENT_ID, now);
    const travel = stats.topics.find((topic) => topic.topicId === "travel");

    expect(travel?.learnable).toBe(TRAVEL_WORDS.length - 1);
  });

  it("tracks learned and due words from progress", async () => {
    const repo = new InMemoryLearningRepository(ALL_SCENARIO_WORDS);
    const now = SCENARIO_NOW;

    const learned = createEmptyWordProgress(SCENARIO_STUDENT_ID, "airport", now, createInitialCard(now));
    learned.state = WordState.Mature;
    learned.totalAttempts = 5;
    learned.recognition.mastery = 0.9;
    learned.recall.mastery = 0.85;
    learned.production.mastery = 0.8;
    learned.context.mastery = 0.75;
    repo.seedProgress(learned);

    const due = createEmptyWordProgress(SCENARIO_STUDENT_ID, "menu", now, createInitialCard(now));
    due.state = WordState.Consolidating;
    due.totalAttempts = 3;
    due.recognition.mastery = 0.5;
    due.recall.mastery = 0.45;
    due.production.mastery = 0.4;
    due.context.mastery = 0.35;
    due.fsrsCard = { ...due.fsrsCard, due: new Date("2026-08-22T12:00:00.000Z"), state: 2 };
    repo.seedProgress(due);

    const stats = await calculateMenuStats(repo, SCENARIO_STUDENT_ID, now);

    expect(stats.learnedWordsCount).toBe(1);
    expect(stats.dueNowCount).toBe(1);
    expect(stats.newWordsCount).toBe(ALL_SCENARIO_WORDS.length - 2);
  });
});
