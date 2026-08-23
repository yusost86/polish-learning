import { WordState } from "../enums/WordState";

export interface TopicProgress {
  topicId: string;
  totalWords: number;
  masteredCount: number;
  criticalCount: number;
  canOpenNextWave: boolean;
  wordsByState: Record<WordState, number>;
}
