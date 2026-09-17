import { getTopicName } from "../../data/wordCatalog";
import type { TopicOverview } from "../../domain/models/TopicOverview";
import type { TopicOverviewViewModel } from "./TopicOverviewViewModel";

export function toTopicOverviewViewModel(overview: TopicOverview): TopicOverviewViewModel {
  return {
    topicId: overview.topicId,
    topicName: getTopicName(overview.topicId),
    topicProgress: overview.topicProgress,
    words: overview.words.map((word) => ({
      wordId: word.wordId,
      term: word.term,
      translation: word.translation,
      state: word.state,
      consecutiveCorrect: word.consecutiveCorrect,
    })),
  };
}
