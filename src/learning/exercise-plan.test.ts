import { describe, expect, it } from "vitest";
import { createStudentWord } from "../fsrs/create-card";
import { chooseExercisePlan, maskWord } from "./exercise-plan";
import type { Word } from "../domain/types";

const word: Word = { id: "w", foreignText: "jabłko", nativeText: "яблуко", topicId: "t", importance: 1, exerciseTypes: ["MULTIPLE_CHOICE", "FILL_BLANK"], createdAt: "2025-01-01" };
describe("exercise plan", () => {
  it("uses the expected pool for a low star card", () => {
    const card = createStudentWord("s", "w");
    expect(chooseExercisePlan(card, word, true).kind).toBe("MULTIPLE_CHOICE");
  });
  it("masks two to three letters without masking spaces", () => {
    const masked = maskWord("ala ma kota", 3);
    expect(masked.replace(/_/g, "").replace(/ /g, "")).toHaveLength("alamakota".length - 3);
    expect(masked.split(" ")).toHaveLength(3);
  });
});
