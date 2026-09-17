import { WordState } from "../domain/enums/WordState";
import type { MenuStats, TopicMenuStats } from "../domain/models/MenuStats";
import type { LearningWord } from "../domain/models/LearningWordModel";
import type { ILearningWordRepository } from "../repositories/ILearningWordRepository";
import type { ITopicRepository } from "../repositories/ITopicRepository";

interface WordCounts {
  learned: number;
  due: number;
  isNew: number;
  learnable: number;
}

function countWord(progress: LearningWord | null): WordCounts {
  if (!progress || progress.wordProgressEntries.length === 0) {
    return { learned: 0, due: 0, isNew: 1, learnable: 1 };
  }

  const learned =
    progress.state === WordState.Mature || progress.state === WordState.Relearning ? 1 : 0;
  const isNew = progress.state === WordState.New ? 1 : 0;
  const learnable =
    progress.state === WordState.New || progress.state === WordState.Learning ? 1 : 0;
  const due =
    progress.state === WordState.Relearning || progress.state === WordState.Consolidating ? 1 : 0;

  return { learned, due, isNew, learnable };
}

export async function calculateMenuStats(
  learningWordRepository: ILearningWordRepository,
  topicRepository: ITopicRepository,
): Promise<MenuStats> {
  const allWords = await topicRepository.getAllWords();
  const topicIds = [...new Set(allWords.map((word) => word.topicId))];
  const topics: TopicMenuStats[] = [];

  let totalUniqueWords = 0;
  let newWordsCount = 0;
  let learnedWordsCount = 0;
  let dueNowCount = 0;

  for (const topicId of topicIds) {
    const topicWords = allWords.filter((word) => word.topicId === topicId);
    const progressList = await learningWordRepository.getLearningWordsByTopic(topicId);
    const progressByWordId = new Map(progressList.map((entry) => [entry.wordId, entry]));

    let topicLearned = 0;
    let topicDue = 0;
    let topicNew = 0;
    let topicLearnable = 0;

    for (const word of topicWords) {
      const counts = countWord(progressByWordId.get(word.id) ?? null);
      topicLearned += counts.learned;
      topicDue += counts.due;
      topicNew += counts.isNew;
      topicLearnable += counts.learnable;
    }

    topics.push({
      topicId,
      total: topicWords.length,
      learned: topicLearned,
      due: topicDue,
      new: topicNew,
      learnable: topicLearnable,
    });

    totalUniqueWords += topicWords.length;
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
