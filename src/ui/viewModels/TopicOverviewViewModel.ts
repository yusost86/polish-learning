import type { WordState } from "../../domain/enums/WordState";
import type { TopicProgress } from "../../domain/models/TopicProgress";

export interface TopicWordViewModel {
  wordId: string;
  term: string;
  translation: string;
  state: WordState;
  consecutiveCorrect: number;
}

export interface TopicOverviewViewModel {
  topicId: string;
  topicName: string;
  topicProgress: TopicProgress;
  words: TopicWordViewModel[];
}
