import type { StoredLearningWord } from "../db/database";
import type { LearningWord } from "../domain/models/LearningWordModel";

export function learningWordStorageId(topicId: string, wordId: string): string {
  return `${topicId}:${wordId}`;
}

export function serializeLearningWord(learningWord: LearningWord): StoredLearningWord {
  return {
    id: learningWord.id,
    wordId: learningWord.wordId,
    topicId: learningWord.topicId,
    state: learningWord.state,
    consecutiveCorrect: learningWord.consecutiveCorrect,
    createdAt: learningWord.createdAt.toISOString(),
    updatedAt: learningWord.updatedAt.toISOString(),
    wordProgressEntries: learningWord.wordProgressEntries.map((entry) => ({
      isCorrect: entry.isCorrect,
      createdAt: entry.createdAt.toISOString(),
      exercise: entry.exercise,
      state: entry.state,
    })),
  };
}

export function deserializeLearningWord(stored: StoredLearningWord): LearningWord {

  return {
    id: stored.id,
    wordId: stored.wordId,
    topicId: stored.topicId,
    state: stored.state,
    consecutiveCorrect:  stored.consecutiveCorrect??0,
    createdAt: new Date(stored.createdAt),
    updatedAt: new Date(stored.updatedAt),
    wordProgressEntries: (stored.wordProgressEntries ?? []).map((entry) => ({
      isCorrect: entry.isCorrect,
      createdAt: new Date(entry.createdAt),
      exercise: entry.exercise,
      state: entry.state,
    })),
  };
}
