import type { LearningQueueItem } from "./LearningQueueItem";
import type { TopicProgress } from "./TopicProgress";
import type { WordState } from "../enums/WordState";

export interface TopicWordOverview {
  wordId: string;
  term: string;
  translation: string;
  state: WordState;
  mastery: number;
  priorityDisplay: number;
  fsrsStatus: string;
  errorCount: number;
  totalAttempts: number;
  isLocked: boolean;
  skills: {
    recognition: number;
    recall: number;
    production: number;
    context: number;
  };
}

export interface TopicOverview {
  topicId: string;
  topicProgress: TopicProgress;
  upcomingTasks: LearningQueueItem[];
  followingTasks: LearningQueueItem[];
  words: TopicWordOverview[];
}
