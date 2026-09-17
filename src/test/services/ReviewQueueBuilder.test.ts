import { describe, expect, it } from "vitest";

import { WordState } from "../../domain/enums/WordState";
import {
  createEmptyLearningWord,
  type LearningWord,
} from "../../domain/models/LearningWordModel";
import { getLearningWordForLessonByState } from "../../services/ReviewQueueBuilder";

function word(wordId: string, state: WordState): LearningWord {
  const progress = createEmptyLearningWord(wordId, "topic", new Date());
  progress.state = state;
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
});
