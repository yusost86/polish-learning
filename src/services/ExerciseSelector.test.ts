import { describe, expect, it } from "vitest";

import { ExerciseType } from "../domain/enums/ExerciseType";
import { WordState } from "../domain/enums/WordState";
import { createEmptyWordProgress } from "../domain/models/WordProgress";
import { selectExerciseType } from "./ExerciseSelector";
import { createInitialCard } from "./FsrsService";
import { progressFromSnapshot } from "../test/fixtures/scenarioHelpers";

const NOW = new Date("2026-08-23T12:00:00.000Z");

describe("ExerciseSelector", () => {
  it("selects Recognition for NEW words", () => {
    const progress = createEmptyWordProgress("student-1", "luggage", NOW, createInitialCard(NOW));
    expect(selectExerciseType(progress)).toBe(ExerciseType.Recognition);
  });

  it("selects exercise based on weakest skill", () => {
    const boardingPass = progressFromSnapshot(
      "student-1",
      {
        wordId: "boarding-pass",
        state: "LEARNING",
        mastery: 0.25,
        skills: { recognition: 0.4, recall: 0.15, production: 0.2, context: 0.25 },
        errorCount: 3,
        fsrsDue: "2026-08-23T11:00:00.000Z",
      },
      NOW,
    );
    expect(selectExerciseType(boardingPass)).toBe(ExerciseType.Recall);

    const airport = progressFromSnapshot(
      "student-1",
      {
        wordId: "airport",
        state: "CONSOLIDATING",
        mastery: 0.55,
        skills: { recognition: 0.75, recall: 0.65, production: 0.55, context: 0.25 },
        errorCount: 0,
        fsrsDue: "2026-08-26T12:00:00.000Z",
      },
      NOW,
    );
    expect(selectExerciseType(airport)).toBe(ExerciseType.Context);
  });

  it("selects Production for weak production skill", () => {
    const passport = progressFromSnapshot(
      "student-1",
      {
        wordId: "passport",
        state: "CONSOLIDATING",
        mastery: 0.44,
        skills: { recognition: 0.55, recall: 0.5, production: 0.22, context: 0.5 },
        errorCount: 0,
        fsrsDue: "2026-08-26T12:00:00.000Z",
      },
      NOW,
    );
    expect(selectExerciseType(passport)).toBe(ExerciseType.Production);
  });

  it("selects MixedRecall for high mastery", () => {
    const progress = createEmptyWordProgress("student-1", "airport", NOW, createInitialCard(NOW));
    progress.state = WordState.Mature;
    progress.totalAttempts = 10;
    progress.recognition.mastery = 0.95;
    progress.recall.mastery = 0.9;
    progress.production.mastery = 0.88;
    progress.context.mastery = 0.86;
    expect(selectExerciseType(progress)).toBe(ExerciseType.MixedRecall);
  });

  it("prefers Context before Production by mastery band when skills are balanced", () => {
    const consolidating = createEmptyWordProgress("student-1", "departure", NOW, createInitialCard(NOW));
    consolidating.state = WordState.Consolidating;
    consolidating.totalAttempts = 5;
    consolidating.recognition.mastery = 0.62;
    consolidating.recall.mastery = 0.6;
    consolidating.production.mastery = 0.58;
    consolidating.context.mastery = 0.58;
    expect(selectExerciseType(consolidating)).toBe(ExerciseType.Context);

    const mature = createEmptyWordProgress("student-1", "reservation", NOW, createInitialCard(NOW));
    mature.state = WordState.Consolidating;
    mature.totalAttempts = 8;
    mature.recognition.mastery = 0.78;
    mature.recall.mastery = 0.76;
    mature.production.mastery = 0.74;
    mature.context.mastery = 0.75;
    expect(selectExerciseType(mature)).toBe(ExerciseType.Production);
  });
});
