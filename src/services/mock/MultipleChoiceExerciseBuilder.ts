import { ExerciseType } from "../../domain/enums/ExerciseType";
import type { ChoiceExerciseTask, ExerciseTask } from "../../domain/models/ExerciseTask";
import type { Word } from "../../domain/models/Word";
import { buildContextTask, buildProductionTask } from "./ContextExerciseBuilder";
import { getMockWords } from "./MockWordCatalog";

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function uniqueDistractors(
  word: Word,
  pool: Word[],
  count: number,
  labelOf: (item: Word) => string,
): Word[] {
  const label = labelOf(word);
  const candidates = pool.filter(
    (candidate) => candidate.id !== word.id && labelOf(candidate) !== label,
  );
  const fallback = getMockWords().filter(
    (candidate) => candidate.id !== word.id && labelOf(candidate) !== label,
  );
  const merged = [...candidates];
  for (const candidate of fallback) {
    if (!merged.some((item) => item.id === candidate.id)) {
      merged.push(candidate);
    }
  }
  return shuffled(merged).slice(0, count);
}

function buildChoiceTask(
  word: Word,
  pool: Word[],
  exerciseType: ExerciseType.Recognition | ExerciseType.Recall,
  prompt: string,
  labelOf: (item: Word) => string,
): ChoiceExerciseTask {
  const distractors = uniqueDistractors(word, pool, 3, labelOf);
  const choices = shuffled([
    { id: word.id, label: labelOf(word) },
    ...distractors.map((distractor) => ({ id: distractor.id, label: labelOf(distractor) })),
  ]);

  return {
    exerciseType,
    wordId: word.id,
    prompt,
    choices,
    correctChoiceId: word.id,
  };
}

export function buildRecognitionTask(word: Word, pool: Word[]): ChoiceExerciseTask {
  return buildChoiceTask(word, pool, ExerciseType.Recognition, word.term, (item) => item.translation);
}

export function buildRecallTask(word: Word, pool: Word[]): ChoiceExerciseTask {
  return buildChoiceTask(word, pool, ExerciseType.Recall, word.translation, (item) => item.term);
}

export function buildExerciseTask(
  word: Word,
  pool: Word[],
  exerciseType: ExerciseType,
): ExerciseTask {
  if (exerciseType === ExerciseType.Context) {
    return buildContextTask(word);
  }
  if (exerciseType === ExerciseType.Production) {
    return buildProductionTask(word);
  }
  if (exerciseType === ExerciseType.Recall || exerciseType === ExerciseType.MixedRecall) {
    return buildRecallTask(word, pool);
  }
  return buildRecognitionTask(word, pool);
}

export function gradeChoiceExercise(task: ChoiceExerciseTask, choiceId: string): boolean {
  return task.correctChoiceId === choiceId;
}

export function getCorrectChoiceLabel(task: ChoiceExerciseTask): string {
  return task.choices.find((choice) => choice.id === task.correctChoiceId)?.label ?? "";
}
