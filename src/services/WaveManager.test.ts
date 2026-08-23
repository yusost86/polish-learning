import { describe, expect, it } from "vitest";

import { WordState } from "../domain/enums/WordState";
import { canOpenNextWave } from "./WaveManager";
import { progressFromSnapshot } from "../test/fixtures/scenarioHelpers";

const NOW = new Date("2026-08-23T12:00:00.000Z");

describe("WaveManager", () => {
  it("blocks next wave when mastery is low", () => {
    const progress = progressFromSnapshot(
      "student-1",
      {
        wordId: "gate",
        state: "RELEARNING",
        mastery: 0,
        skills: { recognition: 0.05, recall: 0, production: 0, context: 0 },
        errorCount: 5,
        fsrsDue: "2026-08-23T10:00:00.000Z",
      },
      NOW,
    );
    expect(canOpenNextWave([progress], NOW)).toBe(false);
  });

  it("opens next wave at 80% mastered and <=20% critical (Topic A milestone)", () => {
    const milestoneWords = [
      { wordId: "airport", mastery: 0.78, state: WordState.Mature },
      { wordId: "boarding-pass", mastery: 0.71, state: WordState.Mature },
      { wordId: "departure", mastery: 0.69, state: WordState.Mature },
      { wordId: "arrival", mastery: 0.58, state: WordState.Consolidating },
      { wordId: "luggage", mastery: 0.67, state: WordState.Mature },
      { wordId: "flight", mastery: 0.66, state: WordState.Mature },
      { wordId: "reservation", mastery: 0.74, state: WordState.Mature },
      { wordId: "gate", mastery: 0.42, state: WordState.Consolidating },
      { wordId: "passport", mastery: 0.7, state: WordState.Mature },
      { wordId: "train-station", mastery: 0.68, state: WordState.Mature },
    ];

    const waveProgress = milestoneWords.map(({ wordId, mastery, state }) => {
      const r = 0.7;
      const rec = mastery / 0.2 / r;
      const progress = progressFromSnapshot(
        "student-1",
        {
          wordId,
          state,
          mastery,
          skills: { recognition: rec, recall: rec, production: rec, context: rec },
          errorCount: wordId === "gate" || wordId === "arrival" ? 2 : 0,
          fsrsDue: "2026-09-01T12:00:00.000Z",
        },
        NOW,
      );
      return progress;
    });

    expect(canOpenNextWave(waveProgress, NOW)).toBe(true);
  });
});
