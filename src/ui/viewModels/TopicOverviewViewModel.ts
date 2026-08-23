import type { ExerciseType } from "../../domain/enums/ExerciseType";
import type { SelectionReason } from "../../domain/enums/SelectionReason";
import type { WordState } from "../../domain/enums/WordState";
import type { TopicProgress } from "../../domain/models/TopicProgress";

export interface UpcomingTaskViewModel {
  index: number;
  wordId: string;
  term: string;
  translation: string;
  exercise: ExerciseType;
  exerciseLabel: string;
  reason: SelectionReason;
  reasonLabel: string;
  priorityDisplay: number;
  mastery: number;
}

export interface TopicWordViewModel {
  wordId: string;
  term: string;
  translation: string;
  state: WordState;
  mastery: number;
  priorityDisplay: number;
  fsrsStatus: string;
  errorCount: number;
  totalAttempts: number;
  skills: {
    recognition: number;
    recall: number;
    production: number;
    context: number;
  };
}

export interface TopicOverviewViewModel {
  topicId: string;
  topicName: string;
  topicProgress: TopicProgress;
  upcomingTasks: UpcomingTaskViewModel[];
  words: TopicWordViewModel[];
}
