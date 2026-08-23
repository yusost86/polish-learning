import { ExerciseType } from "../enums/ExerciseType";
import { SelectionReason } from "../enums/SelectionReason";
import type { Word } from "./Word";

export interface LearningQueueItem {
  word: Word;
  exercise: ExerciseType;
  priority: number;
  priorityDisplay: number;
  mastery: number;
  reason: SelectionReason;
}
