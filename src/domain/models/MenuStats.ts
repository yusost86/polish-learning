export interface TopicMenuStats {
  topicId: string;
  total: number;
  learned: number;
  due: number;
  new: number;
  learnable: number;
}

export interface MenuStats {
  totalUniqueWords: number;
  newWordsCount: number;
  learnedWordsCount: number;
  dueNowCount: number;
  topics: TopicMenuStats[];
}
