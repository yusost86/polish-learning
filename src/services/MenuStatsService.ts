import { WAVE_UNLOCK } from "../domain/constants";
import { WordState } from "../domain/enums/WordState";
import type { MenuStats, TopicMenuStats } from "../domain/models/MenuStats";
import type { WordProgress } from "../domain/models/WordProgress";
import type { LearningDataRepository } from "../repositories/WordProgressRepository";
import { isReviewDue } from "./FsrsService";
import { calculateMastery, getSkillMasteries } from "./MasteryService";
import { getUnlockedTopicWords } from "./WaveManager";

interface WordCounts {
  learned: number;
  due: number;
  isNew: number;
}

function countWord(progress: WordProgress | null, now: Date): WordCounts {
  if (!progress || (progress.state === WordState.New && progress.totalAttempts === 0)) {
    return { learned: 0, due: 0, isNew: 1 };
  }

  const mastery = calculateMastery(getSkillMasteries(progress));
  const learned = mastery >= WAVE_UNLOCK.masteryThreshold ? 1 : 0;
  const due = isReviewDue(progress.fsrsCard, now) ? 1 : 0;
  const isNew = progress.state === WordState.New ? 1 : 0;

  return { learned, due, isNew };
}

export async function calculateMenuStats(
  repository: LearningDataRepository,
  studentId: string,
  now: Date,
): Promise<MenuStats> {
  const allWords = await repository.getAllWords();
  const topicIds = [...new Set(allWords.map((word) => word.topicId))];
  const topics: TopicMenuStats[] = [];

  let totalUniqueWords = 0;
  let newWordsCount = 0;
  let learnedWordsCount = 0;
  let dueNowCount = 0;

  for (const topicId of topicIds) {
    const topicWords = allWords.filter((word) => word.topicId === topicId);
    const waveCount = await repository.getUnlockedWaveCount(studentId, topicId);
    const unlockedWords = getUnlockedTopicWords(topicWords, waveCount);

    let topicLearned = 0;
    let topicDue = 0;
    let topicNew = 0;

    for (const word of unlockedWords) {
      const progress = await repository.getProgress(studentId, word.id);
      const counts = countWord(progress, now);
      topicLearned += counts.learned;
      topicDue += counts.due;
      topicNew += counts.isNew;
    }

    topics.push({
      topicId,
      total: unlockedWords.length,
      learned: topicLearned,
      due: topicDue,
      new: topicNew,
    });

    totalUniqueWords += unlockedWords.length;
    newWordsCount += topicNew;
    learnedWordsCount += topicLearned;
    dueNowCount += topicDue;
  }

  return {
    totalUniqueWords,
    newWordsCount,
    learnedWordsCount,
    dueNowCount,
    topics,
  };
}
