import {
  MAX_ERROR_RISK_COUNT,
  PRIORITY_WEIGHTS,
} from "../domain/constants";
import { WordState } from "../domain/enums/WordState";
import type { WordProgress } from "../domain/models/WordProgress";
import { calculateMastery, getSkillMasteries } from "./MasteryService";
import { overdueScore } from "./FsrsService";

export interface PriorityBreakdown {
  masteryRisk: number;
  errorRisk: number;
  overdueRisk: number;
  weakSkillRisk: number;
  score: number;
  display: number;
}

export function calculatePriorityBreakdown(
  progress: WordProgress,
  now: Date,
): PriorityBreakdown {
  const skills = getSkillMasteries(progress);
  const mastery = calculateMastery(skills);
  const masteryRisk = 1 - mastery;
  const errorRisk = Math.min(progress.errorCount / MAX_ERROR_RISK_COUNT, 1);
  const overdueRisk = overdueScore(progress.fsrsCard, now);
  const minSkill = Math.min(skills.recognition, skills.recall, skills.production, skills.context);
  const weakSkillRisk = 1 - minSkill;

  let score =
    masteryRisk * PRIORITY_WEIGHTS.mastery +
    errorRisk * PRIORITY_WEIGHTS.errors +
    overdueRisk * PRIORITY_WEIGHTS.overdue +
    weakSkillRisk * PRIORITY_WEIGHTS.weakSkill;

  if (progress.totalAttempts === 0 || progress.state === WordState.New) {
    score = 0.8;
  } else if (overdueRisk >= 1) {
    score = Math.max(score, 0.85);
  } else if (progress.state === WordState.Relearning) {
    score = Math.max(score, 0.95);
  }

  if (progress.totalAttempts > 0 && progress.state !== WordState.New) {
    if (mastery < 0.3) {
      score = Math.max(score, 0.8);
      if (minSkill < 0.2) {
        score = Math.max(score, 0.95);
      }
    }
    if (progress.errorCount >= MAX_ERROR_RISK_COUNT) {
      score = Math.max(score, 0.98);
    }
  }

  score = Math.min(1, score);
  const display = Math.round(score * 100);

  return {
    masteryRisk,
    errorRisk,
    overdueRisk,
    weakSkillRisk,
    score,
    display,
  };
}

export class PriorityService {
  calculate(progress: WordProgress, now: Date): PriorityBreakdown {
    return calculatePriorityBreakdown(progress, now);
  }
}
