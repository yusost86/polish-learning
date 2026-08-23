import { WAVE_SIZE, WAVE_UNLOCK } from "../domain/constants";
import { WordState } from "../domain/enums/WordState";
import type { Word } from "../domain/models/Word";
import type { WordProgress } from "../domain/models/WordProgress";
import { calculateMastery, getSkillMasteries, isCriticalWord } from "./MasteryService";
import { calculatePriorityBreakdown } from "./PriorityService";

export function getWaveWordIds(allWordIds: string[], waveIndex: number): string[] {  const start = waveIndex * WAVE_SIZE;
  return allWordIds.slice(start, start + WAVE_SIZE);
}

export function canOpenNextWave(
  waveProgress: WordProgress[],
  now: Date,
): boolean {
  if (waveProgress.length === 0) {
    return false;
  }

  let masteredCount = 0;
  let criticalCount = 0;

  for (const progress of waveProgress) {
    const mastery = calculateMastery(getSkillMasteries(progress));
    if (mastery >= WAVE_UNLOCK.masteryThreshold) {
      masteredCount += 1;
    }
    const priority = calculatePriorityBreakdown(progress, now);
    if (isCriticalWord(mastery, priority.display)) {
      criticalCount += 1;
    }
  }

  const masteredRatio = masteredCount / waveProgress.length;
  const criticalRatio = criticalCount / waveProgress.length;

  return (
    masteredRatio >= WAVE_UNLOCK.masteredRatio &&
    criticalRatio <= WAVE_UNLOCK.maxCriticalRatio
  );
}

export function getCurrentWaveIndex(allWordIds: string[], unlockedWaveCount: number): number {
  return Math.max(0, Math.min(unlockedWaveCount - 1, Math.ceil(allWordIds.length / WAVE_SIZE) - 1));
}

export function getUnlockedWordIds(allWordIds: string[], unlockedWaveCount: number): string[] {
  return allWordIds.slice(0, unlockedWaveCount * WAVE_SIZE);
}

export function getUnlockedTopicWords(words: Word[], waveCount: number): Word[] {
  const unlockedIds = new Set(getUnlockedWordIds(words.map((w) => w.id), waveCount));
  return words.filter((w) => unlockedIds.has(w.id));
}

export function countWordsByState(progressList: WordProgress[]): Record<WordState, number> {  const counts: Record<WordState, number> = {
    [WordState.New]: 0,
    [WordState.Learning]: 0,
    [WordState.Consolidating]: 0,
    [WordState.Mature]: 0,
    [WordState.Relearning]: 0,
  };
  for (const progress of progressList) {
    counts[progress.state] += 1;
  }
  return counts;
}

export class WaveManager {
  canOpenNextWave(waveProgress: WordProgress[], now: Date): boolean {
    return canOpenNextWave(waveProgress, now);
  }

  getUnlockedWordIds(allWordIds: string[], unlockedWaveCount: number): string[] {
    return getUnlockedWordIds(allWordIds, unlockedWaveCount);
  }
}
