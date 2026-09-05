import { describe, expect, it } from "vitest";

import { ExerciseType } from "../domain/enums/ExerciseType";
import type { ChoiceExerciseTask, TypedExerciseTask } from "../domain/models/ExerciseTask";
import { gradeSessionAnswer } from "./answerGrading";

describe("gradeSessionAnswer", () => {
  it("grades choice exercises", () => {
    const task: ChoiceExerciseTask = {
      exerciseType: ExerciseType.Recognition,
      wordId: "airport",
      prompt: "lotnisko",
      choices: [
        { id: "a", label: "аеропорт" },
        { id: "b", label: "банк" },
      ],
      correctChoiceId: "a",
    };

    expect(gradeSessionAnswer(task, { type: "choice", choiceId: "a" }).isCorrect).toBe(true);
    expect(gradeSessionAnswer(task, { type: "choice", choiceId: "b" }).isCorrect).toBe(false);
  });

  it("grades typed exercises", () => {
    const task: TypedExerciseTask = {
      exerciseType: ExerciseType.Production,
      wordId: "airport",
      prompt: "аеропорт",
      expectedTerm: "lotnisko",
    };

    expect(gradeSessionAnswer(task, { type: "typed", text: "lotnisko" }).isCorrect).toBe(true);
    expect(gradeSessionAnswer(task, { type: "typed", text: "bank" }).isCorrect).toBe(false);
  });
});
