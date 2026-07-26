import { beforeEach, describe, expect, it } from "vitest";
import { Rating } from "ts-fsrs";
import { db } from "../db/db";
import { createStudentWord } from "./create-card";
import { submitAnswer } from "./review";

beforeEach(async () => { await Promise.all([db.studentWords.clear(), db.reviewEvents.clear()]); });
describe("submitAnswer", () => {
  it("persists an updated card and review event", async () => {
    const card = createStudentWord("student", "word"); await db.studentWords.add(card);
    const updated = await submitAnswer({ studentWord: card, exerciseType: "FOREIGN_TO_NATIVE", grade: Rating.Good, isCorrect: true, responseTimeMs: 1200 });
    expect(updated.correctCount).toBe(1);
    expect(await db.reviewEvents.count()).toBe(1);
  });
});
