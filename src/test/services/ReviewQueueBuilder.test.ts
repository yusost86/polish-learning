import { describe, expect, it } from "vitest";

import { ExerciseType } from "../../domain/enums/ExerciseType";
import { WordState } from "../../domain/enums/WordState";
import {
  createEmptyLearningWord,
  type LearningWord,
} from "../../domain/models/LearningWordModel";
import { getLearningWordForLessonByState } from "../../services/ReviewQueueBuilder";

interface WordOptions {
  consecutiveCorrect?: number;
  lastAttemptAt?: Date;
}

function word(wordId: string, state: WordState, options: WordOptions = {}): LearningWord {
  const progress = createEmptyLearningWord(wordId, "topic", new Date());
  progress.state = state;
  if (options.consecutiveCorrect !== undefined) {
    progress.consecutiveCorrect = options.consecutiveCorrect;
  }
  if (options.lastAttemptAt !== undefined) {
    progress.updatedAt = options.lastAttemptAt;
    progress.wordProgressEntries.push({
      isCorrect: true,
      createdAt: options.lastAttemptAt,
      exercise: ExerciseType.Flashcard,
      state,
    });
  }
  return progress;
}

function words(state: WordState, count: number, prefix: string): LearningWord[] {
  return Array.from({ length: count }, (_, index) => word(`${prefix}-${index}`, state));
}

function wordIds(result: LearningWord[]): string[] {
  return result.map((item) => item.wordId);
}

describe("getLearningWordForLessonByState", () => {
  it("returns empty array for empty input", () => {
    expect(getLearningWordForLessonByState([])).toEqual([]);
  });

  it("returns all words when fewer than lesson size", () => {
    const input = words(WordState.Learning, 3, "learning");
    const result = getLearningWordForLessonByState(input);

    expect(result).toHaveLength(3);
    expect(wordIds(result)).toEqual(["learning-0", "learning-1", "learning-2"]);
  });

  it("caps lesson at 10 when many words are in one state", () => {
    const input = words(WordState.Learning, 15, "learning");
    const result = getLearningWordForLessonByState(input);

    expect(result).toHaveLength(10);
    expect(result.every((item) => item.state === WordState.Learning)).toBe(true);
  });

  it("prefers Learning before Consolidating when both fill the lesson", () => {
    const input = [
      ...words(WordState.Learning, 5, "learning"),
      ...words(WordState.Consolidating, 5, "consolidating"),
    ];
    const result = getLearningWordForLessonByState(input);

    expect(result).toHaveLength(10);
    expect(wordIds(result).slice(0, 5)).toEqual([
      "learning-0",
      "learning-1",
      "learning-2",
      "learning-3",
      "learning-4",
    ]);
    expect(wordIds(result).slice(5)).toEqual([
      "consolidating-0",
      "consolidating-1",
      "consolidating-2",
      "consolidating-3",
      "consolidating-4",
    ]);
  });

  it("fills remaining lesson slots from the next priority state", () => {
    const input = [
      ...words(WordState.Learning, 8, "learning"),
      ...words(WordState.Consolidating, 8, "consolidating"),
    ];
    const result = getLearningWordForLessonByState(input);

    expect(result).toHaveLength(10);
    expect(result.filter((item) => item.state === WordState.Learning)).toHaveLength(8);
    expect(result.filter((item) => item.state === WordState.Consolidating)).toHaveLength(2);
  });

  it("does not include Consolidating when Learning fills the lesson", () => {
    const input = [
      ...words(WordState.Learning, 10, "learning"),
      ...words(WordState.Consolidating, 10, "consolidating"),
    ];
    const result = getLearningWordForLessonByState(input);

    expect(result).toHaveLength(10);
    expect(result.every((item) => item.state === WordState.Learning)).toBe(true);
  });

  it("respects per-state caps for Mature and Relearning", () => {
    const input = [
      ...words(WordState.Mature, 10, "mature"),
      ...words(WordState.Relearning, 5, "relearning"),
      ...words(WordState.New, 10, "new"),
    ];
    const result = getLearningWordForLessonByState(input);

    expect(result).toHaveLength(10);
    expect(result.filter((item) => item.state === WordState.Mature)).toHaveLength(4);
    expect(result.filter((item) => item.state === WordState.Relearning)).toHaveLength(2);
    expect(result.filter((item) => item.state === WordState.New)).toHaveLength(4);
  });

  it("includes New words when higher-priority pools are empty", () => {
    const input = words(WordState.New, 10, "new");
    const result = getLearningWordForLessonByState(input);

    expect(result).toHaveLength(10);
    expect(result.every((item) => item.state === WordState.New)).toBe(true);
  });

  it("prioritizes Mature words with lower consecutiveCorrect streak", () => {
    const input = [
      word("mature-high", WordState.Mature, { consecutiveCorrect: 5 }),
      word("mature-low-a", WordState.Mature, { consecutiveCorrect: 1 }),
      word("mature-mid", WordState.Mature, { consecutiveCorrect: 3 }),
      word("mature-low-b", WordState.Mature, { consecutiveCorrect: 0 }),
      word("mature-low-c", WordState.Mature, { consecutiveCorrect: 2 }),
    ];
    const result = getLearningWordForLessonByState(input);

    expect(wordIds(result)).toEqual([
      "mature-low-b",
      "mature-low-a",
      "mature-low-c",
      "mature-mid",
      "mature-high",
    ]);
  });

  it("prioritizes Mature words with older last attempt when streak matches", () => {
    const input = [
      word("mature-recent", WordState.Mature, {
        consecutiveCorrect: 2,
        lastAttemptAt: new Date("2026-03-03T12:00:00.000Z"),
      }),
      word("mature-oldest", WordState.Mature, {
        consecutiveCorrect: 2,
        lastAttemptAt: new Date("2026-03-01T12:00:00.000Z"),
      }),
      word("mature-middle", WordState.Mature, {
        consecutiveCorrect: 2,
        lastAttemptAt: new Date("2026-03-02T12:00:00.000Z"),
      }),
    ];
    const result = getLearningWordForLessonByState(input);

    expect(wordIds(result)).toEqual(["mature-oldest", "mature-middle", "mature-recent"]);
  });

  it("prioritizes Relearning words by streak and last attempt", () => {
    const input = [
      ...Array.from({ length: 4 }, (_, index) =>
        word(`mature-${index}`, WordState.Mature, { consecutiveCorrect: index }),
      ),
      word("relearning-high", WordState.Relearning, { consecutiveCorrect: 4 }),
      word("relearning-low", WordState.Relearning, { consecutiveCorrect: 1 }),
      word("relearning-mid", WordState.Relearning, { consecutiveCorrect: 2 }),
    ];
    const result = getLearningWordForLessonByState(input);

    expect(result.filter((item) => item.state === WordState.Relearning)).toHaveLength(3);
    expect(
      wordIds(result.filter((item) => item.state === WordState.Relearning)),
    ).toEqual(["relearning-low", "relearning-mid", "relearning-high"]);
  });

  it("keeps Learning word order unchanged", () => {
    const input = words(WordState.Learning, 5, "learning");
    const result = getLearningWordForLessonByState(input);

    expect(wordIds(result)).toEqual(["learning-0", "learning-1", "learning-2", "learning-3", "learning-4"]);
  });

  it("selects Mature and Relearning by streak and time, not input order", () => {
    const input = [
      word("mature-last-input", WordState.Mature, {
        consecutiveCorrect: 5,
        lastAttemptAt: new Date("2026-03-05T12:00:00.000Z"),
      }),
      word("mature-first-input", WordState.Mature, {
        consecutiveCorrect: 0,
        lastAttemptAt: new Date("2026-03-01T12:00:00.000Z"),
      }),
      word("mature-second-input", WordState.Mature, {
        consecutiveCorrect: 1,
        lastAttemptAt: new Date("2026-03-02T12:00:00.000Z"),
      }),
      word("relearning-last-input", WordState.Relearning, {
        consecutiveCorrect: 4,
        lastAttemptAt: new Date("2026-03-05T12:00:00.000Z"),
      }),
      word("relearning-first-input", WordState.Relearning, {
        consecutiveCorrect: 0,
        lastAttemptAt: new Date("2026-03-01T12:00:00.000Z"),
      }),
      word("relearning-second-input", WordState.Relearning, {
        consecutiveCorrect: 1,
        lastAttemptAt: new Date("2026-03-02T12:00:00.000Z"),
      }),
    ];
    const result = getLearningWordForLessonByState(input);

    expect(wordIds(result)).toEqual([
      "mature-first-input",
      "mature-second-input",
      "mature-last-input",
      "relearning-first-input",
      "relearning-second-input",
      "relearning-last-input",
    ]);
  });
});
