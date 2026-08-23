import type { LearningQueueItem } from "../domain/models/LearningQueueItem";
import type { ExerciseTask } from "../domain/models/ExerciseTask";
import type { Word } from "../domain/models/Word";
import { buildExerciseTask } from "./mock/MultipleChoiceExerciseBuilder";

export function buildTaskFromQueueItem(item: LearningQueueItem, pool: Word[]): ExerciseTask {
  return buildExerciseTask(item.word, pool, item.exercise);
}
