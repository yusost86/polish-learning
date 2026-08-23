import { describe, expect, it } from "vitest";

import { WordState } from "../domain/enums/WordState";
import { createEmptyWordProgress } from "../domain/models/WordProgress";
import { createInitialCard } from "./FsrsService";
import { calculatePriorityBreakdown } from "./PriorityService";
import { progressFromSnapshot } from "../test/fixtures/scenarioHelpers";

const NOW = new Date("2026-08-23T12:00:00.000Z");

describe("PriorityService", () => {
  it("computes component risks for boarding-pass (Appendix D)", () => {
    const progress = progressFromSnapshot(
      "student-1",
      {
        wordId: "boarding-pass",
        state: "LEARNING",
        mastery: 0.25,
        skills: { recognition: 0.4, recall: 0.15, production: 0.2, context: 0.25 },
        errorCount: 3,
        consecutiveCorrect: 1,
        fsrsDue: "2026-08-23T11:00:00.000Z",
      },
      NOW,
    );

    const breakdown = calculatePriorityBreakdown(progress, NOW);
    expect(breakdown.masteryRisk).toBeCloseTo(0.76, 1);
    expect(breakdown.errorRisk).toBe(0.6);
    expect(breakdown.weakSkillRisk).toBeCloseTo(0.85, 2);
    expect(breakdown.display).toBeGreaterThanOrEqual(80);
  });

  it("boosts RELEARNING and max-error words to critical priority", () => {
    const gate = progressFromSnapshot(
      "student-1",
      {
        wordId: "gate",
        state: "RELEARNING",
        mastery: 0,
        skills: { recognition: 0.05, recall: 0, production: 0, context: 0 },
        errorCount: 5,
        consecutiveErrors: 1,
        fsrsDue: "2026-08-23T10:00:00.000Z",
      },
      NOW,
    );

    const breakdown = calculatePriorityBreakdown(gate, NOW);
    expect(breakdown.score).toBeGreaterThanOrEqual(0.95);
    expect(breakdown.display).toBeGreaterThanOrEqual(95);
  });

  it("prioritizes overdue reservation (Due +10d)", () => {
    const reservation = progressFromSnapshot(
      "student-1",
      {
        wordId: "reservation",
        state: "CONSOLIDATING",
        mastery: 0.4,
        skills: { recognition: 0.55, recall: 0.45, production: 0.35, context: 0.25 },
        errorCount: 1,
        fsrsDue: "2026-08-13T12:00:00.000Z",
      },
      NOW,
    );

    const breakdown = calculatePriorityBreakdown(reservation, NOW);
    expect(breakdown.overdueRisk).toBe(1);
    expect(breakdown.display).toBeGreaterThanOrEqual(80);
  });

  it("returns low priority for mature words", () => {
    const progress = createEmptyWordProgress("student-1", "airport", NOW, createInitialCard(NOW));
    progress.state = WordState.Mature;
    progress.totalAttempts = 10;
    progress.recognition.mastery = 0.9;
    progress.recall.mastery = 0.85;
    progress.production.mastery = 0.8;
    progress.context.mastery = 0.75;
    progress.fsrsCard.due = new Date("2026-09-06T12:00:00.000Z");

    const breakdown = calculatePriorityBreakdown(progress, NOW);
    expect(breakdown.display).toBeLessThan(50);
  });
});
