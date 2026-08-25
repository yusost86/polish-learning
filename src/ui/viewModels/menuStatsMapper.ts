import { getTopicName } from "../../data/wordCatalog";
import { TOPIC_REVIEW_THRESHOLD_PCT } from "../../domain/constants";
import type { MenuStats } from "../../domain/models/MenuStats";
import type { TopicMenuStats } from "../../domain/models/MenuStats";
import type { MenuSummary, TopicPrimaryAction, TopicStatViewModel } from "./MenuViewModel";

export function getTopicProgressPct(learned: number, total: number): number {
  return total > 0 ? Math.round((learned / total) * 100) : 0;
}

export function getTopicPrimaryAction(progressPct: number): TopicPrimaryAction {
  return progressPct >= TOPIC_REVIEW_THRESHOLD_PCT ? "review" : "learn";
}

export function toTopicStatViewModel(topic: TopicMenuStats): TopicStatViewModel {
  const progressPct = getTopicProgressPct(topic.learned, topic.total);
  return {
    topicId: topic.topicId,
    name: getTopicName(topic.topicId),
    total: topic.total,
    learned: topic.learned,
    due: topic.due,
    new: topic.new,
    progressPct,
    primaryAction: getTopicPrimaryAction(progressPct),
  };
}

export function toMenuSummary(stats: MenuStats): MenuSummary {
  return {
    totalUniqueWords: stats.totalUniqueWords,
    newWordsCount: stats.newWordsCount,
    learnedWordsCount: stats.learnedWordsCount,
    dueNowCount: stats.dueNowCount,
  };
}

export function toTopicStatViewModels(stats: MenuStats): TopicStatViewModel[] {
  return stats.topics.map(toTopicStatViewModel);
}
