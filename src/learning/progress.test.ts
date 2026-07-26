import { describe, expect, it } from "vitest";
import { createStudentWord } from "../fsrs/create-card";
import { computeGlobalSummary, isDue, isLearned } from "./progress";

describe("progress", () => {
  it("uses mastery state and the learning due date", () => {
    const card = createStudentWord("s", "w");
    card.learningProgress = { ...card.learningProgress!, state: "mature", nextReviewAt: "2000-01-01T00:00:00.000Z" };
    expect(isLearned(card)).toBe(true); expect(isDue(card)).toBe(true);
    expect(computeGlobalSummary([{ word: { id: "w", foreignText: "a", nativeText: "b", topicId: "t", importance: 1, exerciseTypes: [], createdAt: "now" }, studentWord: card }])).toMatchObject({ learnedWordsCount: 1, dueNowCount: 1 });
  });
});
