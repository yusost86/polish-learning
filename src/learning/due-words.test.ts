import { describe, expect, it } from "vitest";
import { createStudentWord } from "../fsrs/create-card";
import { getDueCards } from "./due-words";

describe("getDueCards", () => {
  it("returns only due cards ordered by due date", () => {
    const now = new Date("2025-01-10T12:00:00Z");
    const early = createStudentWord("s", "early"); early.fsrsCard.due = new Date("2025-01-09T12:00:00Z");
    const late = createStudentWord("s", "late"); late.fsrsCard.due = new Date("2025-01-10T11:00:00Z");
    const future = createStudentWord("s", "future"); future.fsrsCard.due = new Date("2025-01-11T12:00:00Z");
    expect(getDueCards([late, future, early], now).map((card) => card.wordId)).toEqual(["early", "late"]);
  });
});
