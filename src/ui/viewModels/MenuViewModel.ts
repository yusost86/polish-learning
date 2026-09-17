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
  learnable: number;
  progressPct: number;
}

