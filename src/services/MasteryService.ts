import {
  CRITICAL_MASTERY_THRESHOLD,
  CRITICAL_PRIORITY_DISPLAY,
  MASTERY_WEIGHTS,
} from "../domain/constants";
import { SkillType } from "../domain/enums/SkillType";
import { WordState } from "../domain/enums/WordState";
import type { SkillProgress } from "../domain/models/SkillProgress";
import type { WordProgress } from "../domain/models/WordProgress";

export interface SkillMasteries {
  recognition: number;
  recall: number;
  production: number;
  context: number;
}

export function getSkillMasteries(progress: WordProgress): SkillMasteries {
  return {
    recognition: progress.recognition.mastery,
    recall: progress.recall.mastery,
    production: progress.production.mastery,
    context: progress.context.mastery,
  };
}

export function calculateMastery(skills: SkillMasteries): number {
  const raw =
    skills.recognition * MASTERY_WEIGHTS.recognition +
    skills.recall * MASTERY_WEIGHTS.recall +
    skills.production * MASTERY_WEIGHTS.production +
    skills.context * MASTERY_WEIGHTS.context;
  return roundMastery(raw);
}

export function roundMastery(value: number): number {
  return Math.round(value * 100) / 100;
}

export function getWeakestSkill(skills: SkillMasteries): SkillType {
  const entries: [SkillType, number][] = [
    [SkillType.Recognition, skills.recognition],
    [SkillType.Recall, skills.recall],
    [SkillType.Context, skills.context],
    [SkillType.Production, skills.production],
  ];
  entries.sort((a, b) => a[1] - b[1]);
  return entries[0][0];
}

export function determineWordState(progress: WordProgress, mastery: number): WordState {
  if (progress.consecutiveErrors >= 2 && progress.totalAttempts > 0) {
    return WordState.Relearning;
  }
  if (progress.totalAttempts === 0) {
    return WordState.New;
  }
  if (mastery < 0.4) {
    return WordState.Learning;
  }
  if (mastery < 0.65) {
    return WordState.Consolidating;
  }
  return WordState.Mature;
}

export function isCriticalWord(mastery: number, priorityDisplay: number): boolean {
  return priorityDisplay >= CRITICAL_PRIORITY_DISPLAY || mastery < CRITICAL_MASTERY_THRESHOLD;
}

export function getSkillProgress(progress: WordProgress, skill: SkillType): SkillProgress {
  switch (skill) {
    case SkillType.Recognition:
      return progress.recognition;
    case SkillType.Recall:
      return progress.recall;
    case SkillType.Production:
      return progress.production;
    case SkillType.Context:
      return progress.context;
  }
}

export function updateSkillMastery(skill: SkillProgress, correct: boolean): void {
  skill.attempts += 1;
  if (correct) {
    skill.correct += 1;
    skill.mastery = Math.min(1, skill.mastery + 0.6 * (1 - skill.mastery));
  } else {
    skill.mastery = Math.max(0, skill.mastery * 0.5);
  }
}

export class MasteryService {
  calculateMastery(progress: WordProgress): number {
    return calculateMastery(getSkillMasteries(progress));
  }

  getWeakestSkill(progress: WordProgress): SkillType {
    return getWeakestSkill(getSkillMasteries(progress));
  }

  determineWordState(progress: WordProgress, mastery: number): WordState {
    return determineWordState(progress, mastery);
  }

  isCritical(mastery: number, priorityDisplay: number): boolean {
    return isCriticalWord(mastery, priorityDisplay);
  }
}
