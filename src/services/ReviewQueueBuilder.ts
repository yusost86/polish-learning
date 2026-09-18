import { WordState } from "../domain/enums/WordState";
import { LearningWord } from "../domain/models/LearningWordModel";

interface ChainStep {
  state: WordState;
  cap: number;
}

/** Default priority for lesson allocation. */
const DEFAULT_PRIORITY: ChainStep[] = [
  { state: WordState.Learning, cap: 10 },
  { state: WordState.Consolidating, cap: 10 },
  { state: WordState.Mature, cap: 4 },
  { state: WordState.Relearning, cap: 2 },
  { state: WordState.New, cap: 10 },
];

const LESSON_SIZE = 10;

function getLastAttemptTime(word: LearningWord): number {
  const last = word.wordProgressEntries.at(-1);
  return last ? last.createdAt.getTime() : word.updatedAt.getTime();
}

function compareReviewCandidates(a: LearningWord, b: LearningWord): number {
  if (a.consecutiveCorrect !== b.consecutiveCorrect) {
    return a.consecutiveCorrect - b.consecutiveCorrect;
  }
  return getLastAttemptTime(a) - getLastAttemptTime(b);
}

function sortReviewCandidates(words: LearningWord[]): void {
  words.sort(compareReviewCandidates);
}

function getQueueByQuata(learningWords: LearningWord[], limit: number): LearningWord[] {
    // todo -dequeue from learningWords
    return learningWords.splice(0, limit);
}
/**
 * @param available   How many words are available in each state
 * @param chain       Priority chain (state + cap), in order
 * @param waveSize    Target lesson size (default 10)
 */

/** Builds a lesson queue from available learning words using {@link allocateWave}. */
export const getLearningWordForLessonByState = (learningWords: LearningWord[]): LearningWord[] => {
  const byState = new Map<WordState, LearningWord[]>();
  for (const state of Object.values(WordState)) {
    byState.set(state, []);
  }

  for (const learningWord of learningWords) {
    byState.get(learningWord.state)!.push(learningWord);
  }

  sortReviewCandidates(byState.get(WordState.Mature)!);
  sortReviewCandidates(byState.get(WordState.Relearning)!);

  const result: LearningWord[] = [];
  let limit = Math.min(learningWords.length, LESSON_SIZE);
  while(limit > 0){
    for (const step of DEFAULT_PRIORITY) { 
      const quota = Math.min(limit, step.cap);
      const  candidates = getQueueByQuata(byState.get(step.state)!, quota);
      result.push(...candidates);
      limit -= candidates.length;
    }
  }

  return result;
};

