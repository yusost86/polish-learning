export interface MenuSummary {
  totalUniqueWords: number;
  newWordsCount: number;
  learnedWordsCount: number;
  dueNowCount: number;
}

export type TopicPrimaryAction = "learn" | "review";

export interface TopicStatViewModel {
  topicId: string;
  name: string;
  total: number;
  learned: number;
  due: number;
  new: number;
  progressPct: number;
  primaryAction: TopicPrimaryAction;
}

export interface MenuViewModel {
  summary: MenuSummary;
  topicStats: TopicStatViewModel[];
}

export type { SessionMode } from "../../domain/enums/SessionMode";
