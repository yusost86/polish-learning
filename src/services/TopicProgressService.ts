import { WAVE_UNLOCK } from "../domain/constants";
import type { TopicProgress } from "../domain/models/TopicProgress";
import type { WordProgress } from "../domain/models/WordProgress";
import type { TopicProgressRepository, WordProgressRepository } from "../repositories/WordProgressRepository";
import { calculateMastery, getSkillMasteries, isCriticalWord } from "./MasteryService";
import { calculatePriorityBreakdown } from "./PriorityService";
import { canOpenNextWave, countWordsByState, getWaveWordIds } from "./WaveManager";

type TopicProgressDataSource = WordProgressRepository & TopicProgressRepository;

export async function calculateTopicProgress(
  repository: TopicProgressDataSource,
  studentId: string,
  topicId: string,
  now: Date,
): Promise<TopicProgress> {
  const topicWords = await repository.getTopicWords(topicId);
  const progressList: WordProgress[] = [];

  for (const word of topicWords) {
    const progress = await repository.getProgress(studentId, word.id);
    if (progress) {
      progressList.push(progress);
    }
  }

  let masteredCount = 0;
  let criticalCount = 0;
  for (const progress of progressList) {
    const mastery = calculateMastery(getSkillMasteries(progress));
    const priority = calculatePriorityBreakdown(progress, now);
    if (mastery >= WAVE_UNLOCK.masteryThreshold) {
      masteredCount += 1;
    }
    if (isCriticalWord(mastery, priority.display)) {
      criticalCount += 1;
    }
  }

  const waveCount = await repository.getUnlockedWaveCount(studentId, topicId);
  const waveWordIds = getWaveWordIds(
    topicWords.map((w) => w.id),
    waveCount - 1,
  );
  const waveProgress = progressList.filter((p) => waveWordIds.includes(p.wordId));

  return {
    topicId,
    totalWords: topicWords.length,
    masteredCount,
    criticalCount,
    canOpenNextWave: canOpenNextWave(waveProgress, now),
    wordsByState: countWordsByState(progressList),
  };
}
