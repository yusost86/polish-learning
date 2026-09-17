import type { WordState } from "../enums/WordState";
import type { TopicProgress } from "./TopicProgress";

export interface TopicWordOverview {
  wordId: string;
  term: string;
  translation: string;
  state: WordState;
  consecutiveCorrect: number;
}

export interface TopicOverview {
  topicId: string;
  topicProgress: TopicProgress;
  words: TopicWordOverview[];
}
