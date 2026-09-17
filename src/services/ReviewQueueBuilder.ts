import { WordState } from "../domain/enums/WordState";
import { LearningWord } from "../domain/models/LearningWordModel";

interface ChainStep {
  state: WordState;
  cap: number;
}

/** Default priority chain for lesson allocation. */
const DEFAULT_CHAIN: ChainStep[] = [
  { state: WordState.Learning, cap: 10 },
  { state: WordState.Consolidating, cap: 10 },
  { state: WordState.Mature, cap: 4 },
  { state: WordState.Relearning, cap: 2 },
  { state: WordState.New, cap: 10 },
  { state: WordState.Relearning, cap: 5 },
];

const EMPTY_TAKEN: Record<WordState, number> = {
  [WordState.Learning]: 0,
  [WordState.Consolidating]: 0,
  [WordState.Mature]: 0,
  [WordState.Relearning]: 0,
  [WordState.New]: 0,
};

const LESSON_SIZE = 10;

/**
 * @param available   How many words are available in each state
 * @param chain       Priority chain (state + cap), in order
 * @param waveSize    Target lesson size (default 10)
 */
export function allocateWave(
  available: Record<WordState, number>,
  chain: ChainStep[] = DEFAULT_CHAIN,
  waveSize: number = LESSON_SIZE,
) {
  const taken: Record<WordState, number> = { ...EMPTY_TAKEN };
  let remaining = waveSize;

  for (const step of chain) {
    if (remaining <= 0) {
      break;
    }

    const alreadyTakenFromState = taken[step.state];
    const availableLeft = Math.max(available[step.state] - alreadyTakenFromState, 0);
    const take = Math.min(step.cap, availableLeft, remaining);

    taken[step.state] += take;
    remaining -= take;
  }

  return { taken, shortfall: remaining };
}

/** Builds a lesson queue from available learning words using {@link allocateWave}. */
export const getLearningWordForLessonByState = (learningWords: LearningWord[]): LearningWord[] => {
  const byState = new Map<WordState, LearningWord[]>();
  for (const state of Object.values(WordState)) {
    byState.set(state, []);
  }

  for (const learningWord of learningWords) {
    byState.get(learningWord.state)!.push(learningWord);
  }

  const available: Record<WordState, number> = {
    [WordState.Learning]: byState.get(WordState.Learning)!.length,
    [WordState.Consolidating]: byState.get(WordState.Consolidating)!.length,
    [WordState.Mature]: byState.get(WordState.Mature)!.length,
    [WordState.Relearning]: byState.get(WordState.Relearning)!.length,
    [WordState.New]: byState.get(WordState.New)!.length,
  };

  const { taken } = allocateWave(available);
  const indexByState: Record<WordState, number> = { ...EMPTY_TAKEN };
  const result: LearningWord[] = [];

  for (const step of DEFAULT_CHAIN) {
    if (result.length >= LESSON_SIZE) {
      break;
    }

    const pool = byState.get(step.state)!;
    const start = indexByState[step.state];
    const remainingForState = taken[step.state] - start;
    const take = Math.min(step.cap, remainingForState, pool.length - start, LESSON_SIZE - result.length);

    for (let i = 0; i < take; i += 1) {
      result.push(pool[start + i]);
    }

    indexByState[step.state] += take;
  }

  return result;
};
