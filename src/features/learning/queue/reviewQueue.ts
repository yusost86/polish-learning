import { selectExercise } from "../exercises/exerciseSelector";
import type {WordModel, WordLearningStats } from "../types";

interface QueueItem {
  word: WordModel;
}
function isOverdue(stats: WordLearningStats): boolean {
  return stats.nextReviewAt
    ? stats.nextReviewAt.getTime() <= Date.now()
    : false;
}
function calculatePriority(stats: WordLearningStats): number {
  return (
    (1 - stats.mastery) * 40 +
    Math.min(stats.wrongAnswers * 5, 25) +
    (isOverdue(stats) ? 30 : 0) -
    Math.min(stats.correctStreak * 2, 15)
  );
}
export function buildReviewQueue(
  words: WordModel[],
  statsMap: Map<string, WordLearningStats>,
  limit = 10,
): QueueItem[] {
 const prioritizedWords =   words
    .flatMap((word) => {
      const stats = statsMap.get(word.id);
      if (!stats)
        return [];
      
      const exercise= selectExercise(word, stats);
      const priority= calculatePriority(stats);
      return [
            {
              word,
              stats,
              exercise: exercise,
              priority: priority,
            },
          ]
        
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
    console.log(prioritizedWords);
    return prioritizedWords;
}
