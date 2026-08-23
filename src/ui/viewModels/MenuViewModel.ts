export interface MenuSummary {
  totalUniqueWords: number;
  newWordsCount: number;
  learnedWordsCount: number;
  dueNowCount: number;
}

export interface TopicStatViewModel {
  topicId: string;
  name: string;
  total: number;
  learned: number;
  due: number;
  new: number;
}

export interface MenuViewModel {
  summary: MenuSummary;
  topicStats: TopicStatViewModel[];
}

export type { SessionMode } from "../../domain/enums/SessionMode";
