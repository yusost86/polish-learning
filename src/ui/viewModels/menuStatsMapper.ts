import { getTopicName } from "../../data/wordCatalog";
import type { MenuStats } from "../../domain/models/MenuStats";
import type { MenuSummary, TopicStatViewModel } from "./MenuViewModel";

export function toMenuSummary(stats: MenuStats): MenuSummary {
  return {
    totalUniqueWords: stats.totalUniqueWords,
    newWordsCount: stats.newWordsCount,
    learnedWordsCount: stats.learnedWordsCount,
    dueNowCount: stats.dueNowCount,
  };
}

export function toTopicStatViewModels(stats: MenuStats): TopicStatViewModel[] {
  return stats.topics.map((topic) => ({
    topicId: topic.topicId,
    name: getTopicName(topic.topicId),
    total: topic.total,
    learned: topic.learned,
    due: topic.due,
    new: topic.new,
  }));
}
