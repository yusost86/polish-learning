import { selectExercise } from "../exercises/exerciseSelector";
import type { ExerciseSelection, Word, WordLearningStats } from "../types";

export interface QueueItem { word: Word; stats: WordLearningStats; exercise: ExerciseSelection; priority: number; }
function isOverdue(stats: WordLearningStats): boolean { return stats.nextReviewAt ? stats.nextReviewAt.getTime() <= Date.now() : false; }
function calculatePriority(stats: WordLearningStats): number {
  return (1 - stats.mastery) * 40 + Math.min(stats.wrongAnswers * 5, 25) + (isOverdue(stats) ? 30 : 0) - Math.min(stats.correctStreak * 2, 15);
}
export function buildReviewQueue(words: Word[], statsMap: Map<string, WordLearningStats>, limit = 10): QueueItem[] {
  return words.flatMap((word) => {
    const stats = statsMap.get(word.id);
    return stats ? [{ word, stats, exercise: selectExercise(word, stats), priority: calculatePriority(stats) }] : [];
  }).sort((a, b) => b.priority - a.priority).slice(0, limit);
}
