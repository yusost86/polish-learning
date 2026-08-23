import { describe, expect, it } from "vitest";

import { MASTERY_WEIGHTS } from "../domain/constants";
import { SkillType } from "../domain/enums/SkillType";
import { WordState } from "../domain/enums/WordState";
import { createEmptyWordProgress } from "../domain/models/WordProgress";
import {
  calculateMastery,
  determineWordState,
  getWeakestSkill,
  roundMastery,
} from "./MasteryService";
import { createInitialCard } from "./FsrsService";

describe("MasteryService", () => {
  it("calculates weighted mastery (Appendix D boarding-pass)", () => {
    const mastery = calculateMastery({
      recognition: 0.4,
      recall: 0.15,
      production: 0.2,
      context: 0.25,
    });
    expect(roundMastery(mastery)).toBe(0.24);
    expect(roundMastery(0.235)).toBe(0.24);
  });

  it("uses mastery weights from scenario contract", () => {
    expect(MASTERY_WEIGHTS.recognition).toBe(0.2);
    expect(MASTERY_WEIGHTS.recall).toBe(0.3);
    expect(MASTERY_WEIGHTS.production).toBe(0.3);
    expect(MASTERY_WEIGHTS.context).toBe(0.2);
  });

  it("detects weakest skill", () => {
    const weakest = getWeakestSkill({
      recognition: 0.9,
      recall: 0.8,
      production: 0.35,
      context: 0.7,
    });
    expect(weakest).toBe(SkillType.Production);
  });

  it("determines word state from mastery and errors", () => {
    const now = new Date("2026-08-23T12:00:00.000Z");
    const progress = createEmptyWordProgress("student-1", "airport", now, createInitialCard(now));
    progress.totalAttempts = 1;

    expect(determineWordState(progress, 0.2)).toBe(WordState.Learning);
    expect(determineWordState(progress, 0.5)).toBe(WordState.Consolidating);
    expect(determineWordState(progress, 0.7)).toBe(WordState.Mature);

    progress.consecutiveErrors = 2;
    expect(determineWordState(progress, 0.7)).toBe(WordState.Relearning);
  });
});