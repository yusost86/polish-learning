import { describe, expect, it } from "vitest";
import { State } from "ts-fsrs";
import { createStudentWord } from "./create-card";

describe("createStudentWord", () => {
  it("creates a new FSRS card and empty mastery progress", () => {
    const card = createStudentWord("student", "word");
    expect(card.fsrsCard.state).toBe(State.New);
    expect(card.learningProgress).toMatchObject({ state: "new", mastery: 0, attempts: 0 });
  });
});
