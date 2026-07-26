import { MASTERY_THRESHOLDS } from "../constants";
import type { TopicProgress, WordLearningStats } from "../types";

export function calculateTopicProgress(topicId: string, words: WordLearningStats[]): TopicProgress {
  const topicWords = words.filter((word) => word.topicId === topicId);
  const count = (state: WordLearningStats["state"]) => topicWords.filter((word) => word.state === state).length;
  const totalWords = topicWords.length;
  const matureWords = count("mature");
  const averageMastery = totalWords === 0 ? 0 : topicWords.reduce((sum, word) => sum + word.mastery, 0) / totalWords;
  return { topicId, totalWords, newWords: count("new"), introducedWords: count("introduced"), learningWords: count("learning"), consolidatingWords: count("consolidating"), matureWords, averageMastery,
    completed: totalWords > 0 && matureWords === totalWords && averageMastery >= MASTERY_THRESHOLDS.MATURE };
}
export function selectNewWords(words: WordLearningStats[], limit: number): WordLearningStats[] { return words.filter((word) => word.state === "new").sort((a, b) => a.mastery - b.mastery).slice(0, limit); }
export function canUnlockNextWave(words: WordLearningStats[]): boolean {
  return words.length > 0 && words.filter((word) => word.mastery >= MASTERY_THRESHOLDS.CONSOLIDATING).length / words.length >= 0.8;
}
