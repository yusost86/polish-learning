import { describe, expect, it } from "vitest";

import { QUEUE_SLOTS } from "../domain/constants";
import { ExerciseType } from "../domain/enums/ExerciseType";
import { SelectionReason } from "../domain/enums/SelectionReason";
import { WordState } from "../domain/enums/WordState";
import { createEmptyWordProgress } from "../domain/models/WordProgress";
import { InMemoryLearningRepository } from "../repositories/InMemoryLearningRepository";
import { createInitialCard } from "./FsrsService";
import { ReviewQueueBuilder } from "./ReviewQueueBuilder";
import {
  ALL_SCENARIO_WORDS,
  SCENARIO_NOW,
  SCENARIO_STUDENT_ID,
  TRAVEL_WORDS,
} from "../test/fixtures/scenarioWords";
import { progressFromSnapshot, seedTopicAIter1Before } from "../test/fixtures/scenarioHelpers";

describe("ReviewQueueBuilder", () => {
  const builder = new ReviewQueueBuilder();
  const now = SCENARIO_NOW;

  it("returns max 10 items without duplicates on cold start", () => {
    const progressByWordId = new Map(
      TRAVEL_WORDS.map((word) => [
        word.id,
        createEmptyWordProgress(SCENARIO_STUDENT_ID, word.id, now, createInitialCard(now)),
      ]),
    );

    const queue = builder.build({
      topicId: "travel",
      topicWords: TRAVEL_WORDS,
      allWords: TRAVEL_WORDS,
      progressByWordId,
      now,
    });

    expect(queue).toHaveLength(10);
    const ids = queue.map((item) => item.word.id);
    expect(new Set(ids).size).toBe(10);
    expect(queue.every((item) => item.reason === SelectionReason.NewWord)).toBe(true);
    expect(queue.every((item) => item.exercise === ExerciseType.Recognition)).toBe(true);
    expect(queue.every((item) => item.priorityDisplay === 80)).toBe(true);
  });

  it("includes critical, due, weak, and new words for Topic A iter 1", () => {
    const repo = new InMemoryLearningRepository(ALL_SCENARIO_WORDS);
    const progressList = seedTopicAIter1Before(SCENARIO_STUDENT_ID, now);
    for (const progress of progressList) {
      repo.seedProgress(progress);
    }

    const progressByWordId = new Map<string, ReturnType<typeof createEmptyWordProgress>>();
    for (const word of ALL_SCENARIO_WORDS) {
      const existing = progressList.find((p) => p.wordId === word.id);
      progressByWordId.set(
        word.id,
        existing ??
          createEmptyWordProgress(SCENARIO_STUDENT_ID, word.id, now, createInitialCard(now)),
      );
    }

    const queue = builder.build({
      topicId: "travel",
      topicWords: TRAVEL_WORDS,
      allWords: ALL_SCENARIO_WORDS,
      progressByWordId,
      now,
    });

    expect(queue).toHaveLength(10);
    const ids = queue.map((item) => item.word.id);
    expect(new Set(ids).size).toBe(10);

    expect(ids).toContain("boarding-pass");
    expect(ids).toContain("gate");
    expect(ids).toContain("reservation");
    expect(ids).toContain("luggage");
    expect(ids).toContain("flight");
    expect(ids).toContain("arrival");

    const reasons = new Set(queue.map((item) => item.reason));
    expect(reasons.has(SelectionReason.CriticalWeak) || reasons.has(SelectionReason.HighErrors)).toBe(true);
    expect(reasons.has(SelectionReason.Overdue) || reasons.has(SelectionReason.FsrsDue)).toBe(true);
    expect(reasons.has(SelectionReason.NewWord)).toBe(true);
  });

  it("includes cross-topic mixed review for Topic C", () => {
    const repo = new InMemoryLearningRepository(ALL_SCENARIO_WORDS);
    const travelMature = ["airport", "boarding-pass", "departure", "luggage", "flight", "reservation", "passport", "train-station"];
    for (const wordId of travelMature) {
      const progress = progressFromSnapshot(
        SCENARIO_STUDENT_ID,
        {
          wordId,
          state: WordState.Mature,
          mastery: 0.7,
          skills: { recognition: 0.8, recall: 0.75, production: 0.7, context: 0.65 },
          errorCount: 0,
          fsrsDue: "2026-09-01T12:00:00.000Z",
        },
        now,
      );
      repo.seedProgress(progress);
    }

    const progressByWordId = new Map<string, ReturnType<typeof createEmptyWordProgress>>();
    for (const word of ALL_SCENARIO_WORDS) {
      const existing = repo["progress"].get(`${SCENARIO_STUDENT_ID}:${word.id}`);
      progressByWordId.set(
        word.id,
        existing ??
          createEmptyWordProgress(SCENARIO_STUDENT_ID, word.id, now, createInitialCard(now)),
      );
    }

    const queue = builder.build({
      topicId: "daily-life",
      topicWords: ALL_SCENARIO_WORDS.filter((w) => w.topicId === "daily-life"),
      allWords: ALL_SCENARIO_WORDS,
      progressByWordId,
      now,
      includeCrossTopicMixed: true,
    });

    const travelInQueue = queue.filter((item) => item.word.topicId === "travel");
    expect(travelInQueue.length).toBeGreaterThan(0);
    expect(queue.filter((item) => item.word.topicId === "daily-life").length).toBeGreaterThan(0);
  });

  it("new session mode uses fallback when only consolidating words are not yet due", () => {
    const progressByWordId = new Map<string, ReturnType<typeof createEmptyWordProgress>>();

    for (const word of TRAVEL_WORDS) {
      const progress = createEmptyWordProgress(SCENARIO_STUDENT_ID, word.id, now, createInitialCard(now));
      progress.state = WordState.Consolidating;
      progress.totalAttempts = 3;
      progress.recognition.mastery = 0.5;
      progress.recall.mastery = 0.45;
      progress.production.mastery = 0.4;
      progress.context.mastery = 0.35;
      progress.fsrsCard = {
        ...progress.fsrsCard,
        due: new Date("2026-09-01T12:00:00.000Z"),
        state: 2,
        reps: 1,
      };
      progressByWordId.set(word.id, progress);
    }

    const queue = builder.build({
      topicId: "travel",
      topicWords: TRAVEL_WORDS,
      allWords: TRAVEL_WORDS,
      progressByWordId,
      now,
      sessionMode: "new",
    });

    expect(queue.length).toBeGreaterThan(0);
    expect(queue.length).toBeLessThanOrEqual(QUEUE_SLOTS.total);
    expect(queue.every((item) => item.reason === SelectionReason.Learning)).toBe(true);
  });

  it("new session mode does not use fallback when New or Learning words exist", () => {
    const progressByWordId = new Map<string, ReturnType<typeof createEmptyWordProgress>>();

    for (const [index, word] of TRAVEL_WORDS.entries()) {
      const progress = createEmptyWordProgress(SCENARIO_STUDENT_ID, word.id, now, createInitialCard(now));
      if (index === 0) {
        progressByWordId.set(word.id, progress);
        continue;
      }
      progress.state = WordState.Consolidating;
      progress.totalAttempts = 3;
      progress.fsrsCard = {
        ...progress.fsrsCard,
        due: new Date("2026-09-01T12:00:00.000Z"),
        state: 2,
        reps: 1,
      };
      progressByWordId.set(word.id, progress);
    }

    const queue = builder.build({
      topicId: "travel",
      topicWords: TRAVEL_WORDS,
      allWords: TRAVEL_WORDS,
      progressByWordId,
      now,
      sessionMode: "new",
    });

    expect(queue).toHaveLength(1);
    expect(queue[0]?.reason).toBe(SelectionReason.NewWord);
    expect(queue[0]?.word.id).toBe("airport");
  });

  it("new session mode prioritizes new and learning words only", () => {
    const progressByWordId = new Map(
      TRAVEL_WORDS.map((word) => [
        word.id,
        createEmptyWordProgress(SCENARIO_STUDENT_ID, word.id, now, createInitialCard(now)),
      ]),
    );

    const queue = builder.build({
      topicId: "travel",
      topicWords: TRAVEL_WORDS,
      allWords: TRAVEL_WORDS,
      progressByWordId,
      now,
      sessionMode: "new",
    });

    expect(queue).toHaveLength(10);
    expect(queue.every((item) => item.reason === SelectionReason.NewWord)).toBe(true);
  });

  it("due session mode excludes brand-new words", () => {
    const progressByWordId = new Map(
      TRAVEL_WORDS.map((word) => [
        word.id,
        createEmptyWordProgress(SCENARIO_STUDENT_ID, word.id, now, createInitialCard(now)),
      ]),
    );

    const queue = builder.build({
      topicId: "travel",
      topicWords: TRAVEL_WORDS,
      allWords: TRAVEL_WORDS,
      progressByWordId,
      now,
      sessionMode: "due",
    });

    expect(queue).toHaveLength(0);
  });

  it("due session mode returns only FSRS due words without filling to 10", () => {
    const progressByWordId = new Map<string, ReturnType<typeof createEmptyWordProgress>>();

    for (const [index, word] of TRAVEL_WORDS.entries()) {
      const progress = createEmptyWordProgress(SCENARIO_STUDENT_ID, word.id, now, createInitialCard(now));
      if (index === 0) {
        progressByWordId.set(word.id, progress);
        continue;
      }
      progress.state = WordState.Learning;
      progress.totalAttempts = 2;
      progress.fsrsCard = {
        ...progress.fsrsCard,
        due: new Date("2026-08-22T12:00:00.000Z"),
        state: 2,
        reps: 1,
      };
      progressByWordId.set(word.id, progress);
    }

    const queue = builder.build({
      topicId: "travel",
      topicWords: TRAVEL_WORDS,
      allWords: TRAVEL_WORDS,
      progressByWordId,
      now,
      sessionMode: "due",
    });

    expect(queue).toHaveLength(TRAVEL_WORDS.length - 1);
    expect(queue.length).toBeLessThan(QUEUE_SLOTS.total);
  });
});
