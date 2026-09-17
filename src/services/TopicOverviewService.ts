import { WordState } from "../domain/enums/WordState";
import type { TopicOverview } from "../domain/models/TopicOverview";
import type { ILearningWordRepository } from "../repositories/ILearningWordRepository";
import type { ITopicRepository } from "../repositories/ITopicRepository";

export async function buildTopicOverview(
  topicRepository: ITopicRepository,
  learningWordRepository: ILearningWordRepository,
  topicId: string,
): Promise<TopicOverview> {
  const [words, progressList] = await Promise.all([
    topicRepository.getAllWords(),
    learningWordRepository.getLearningWordsByTopic(topicId),
  ]);

  const topicWords = words.filter((word) => word.topicId === topicId);
  const progressByWordId = new Map(progressList.map((entry) => [entry.wordId, entry]));

  let masteredCount = 0;
  let learningCount = 0;
  let newCount = 0;

  const overviewWords = topicWords.map((word) => {
    const progress = progressByWordId.get(word.id);
    const state = progress?.state ?? WordState.New;
    const consecutiveCorrect = progress?.consecutiveCorrect ?? 0;

    if (state === WordState.Mature) {
      masteredCount += 1;
    } else if (state === WordState.New) {
      newCount += 1;
    } else {
      learningCount += 1;
    }

    return {
      wordId: word.id,
      term: word.term,
      translation: word.translation,
      state,
      consecutiveCorrect,
    };
  });

  return {
    topicId,
    topicProgress: {
      totalWords: topicWords.length,
      masteredCount,
      learningCount,
      newCount,
    },
    words: overviewWords,
  };
}
