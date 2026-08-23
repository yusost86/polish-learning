import type { Word } from "../domain/models/Word";
import type { WordProgress } from "../domain/models/WordProgress";
import type { PriorityBreakdown } from "./PriorityService";

export interface QueueCandidate {
  word: Word;
  progress: WordProgress;
  priority: PriorityBreakdown;
  mastery: number;
}
