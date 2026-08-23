import { getTopicName } from "../../data/wordCatalog";
import type { LearningQueueItem } from "../../domain/models/LearningQueueItem";
import type { TopicOverview } from "../../domain/models/TopicOverview";
import { exerciseTypeTitle } from "../../utils/exerciseUtils";
import { selectionReasonLabel } from "../../utils/topicDisplayUtils";
import type { TopicOverviewViewModel, UpcomingTaskViewModel } from "./TopicOverviewViewModel";

function toUpcomingTaskViewModel(item: LearningQueueItem, index: number): UpcomingTaskViewModel {
  return {
    index: index + 1,
    wordId: item.word.id,
    term: item.word.term,
    translation: item.word.translation,
    exercise: item.exercise,
    exerciseLabel: exerciseTypeTitle(item.exercise),
    reason: item.reason,
    reasonLabel: selectionReasonLabel(item.reason),
    priorityDisplay: item.priorityDisplay,
    mastery: item.mastery,
  };
}

export function toTopicOverviewViewModel(overview: TopicOverview): TopicOverviewViewModel {
  return {
    topicId: overview.topicId,
    topicName: getTopicName(overview.topicId),
    topicProgress: overview.topicProgress,
    upcomingTasks: overview.upcomingTasks.map(toUpcomingTaskViewModel),
    words: overview.words,
  };
}
