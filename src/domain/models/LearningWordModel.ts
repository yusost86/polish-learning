
import { WordState } from "../enums/WordState";
import { ExerciseType } from "../enums/ExerciseType";
import { Word } from "./Word";


const STATE_ORDER = [
  WordState.New,
  WordState.Learning,
  WordState.Consolidating,
  WordState.Mature,
  WordState.Relearning,
] as const;

/** Streak needed to leave this state; Relearning is the top of the chain. */
const ADVANCE_STREAK: Record<WordState, number> = {
  [WordState.New]: 1,
  [WordState.Learning]: 4,
  [WordState.Consolidating]: 4,
  [WordState.Mature]: 2,
  [WordState.Relearning]: Number.POSITIVE_INFINITY,
};

/**
 * Moves one step on New → Learning → Consolidating → Mature → Relearning.
 * Thresholds match WordState: New 1, Learning/Consolidating 4 (two exercises × 2), Mature 2.
 * Any failure (`consecutiveCorrect < 0`) steps back; New has nowhere to go.
 */
export function determineWordState(progress: LearningWord): WordState {
  const index = STATE_ORDER.indexOf(progress.state);
  if (progress.consecutiveCorrect <= 0) {
    return STATE_ORDER[Math.max(0, index - 1)];
  }
  if (progress.consecutiveCorrect >= ADVANCE_STREAK[progress.state]) {
    return STATE_ORDER[Math.min(STATE_ORDER.length - 1, index + 1)];
  }
  return progress.state;
}

interface WordProgressEntry {
  isCorrect: boolean;
  createdAt: Date;
  exercise: ExerciseType;
  state: WordState;
}

export interface LearningWord {
  id: string;
  wordId: string;
  topicId: string;
  state: WordState;
  consecutiveCorrect: number;
  createdAt: Date;
  updatedAt: Date;
  wordProgressEntries: WordProgressEntry[];
}

export function createEmptyLearningWord(
  wordId: string,
  topicId: string,
  now: Date,
): LearningWord {
  return {
    id: `${topicId}:${wordId}`,
    wordId,
    topicId,
    state: WordState.New,
    consecutiveCorrect: 0,
    createdAt: now,
    updatedAt: now,
    wordProgressEntries: [],
  };
}

export class LearningWordModel {
  public LearningWord: LearningWord;
  public readonly word: Word;
  public readonly getWordPool: () => Word[];
  constructor(learningWord: LearningWord, word: Word, getWordPool: () => Word[]) {
    this.LearningWord = learningWord;
    this.getWordPool = getWordPool;
    this.word = word;
  }

  private stateChanged: boolean = false;

  public addHistoryExerciseEntry(isCorrect: boolean, exercise: ExerciseType): void {

    if (isCorrect) {
      this.LearningWord.consecutiveCorrect += 1;
    } else if (this.LearningWord.consecutiveCorrect > 0) {
      this.LearningWord.consecutiveCorrect -= 1;
    }

    this.LearningWord.wordProgressEntries.push({
      isCorrect: isCorrect,
      createdAt: new Date(),
      exercise: exercise,
      state: this.LearningWord.state,
    });

    if (this.stateChanged) {
      return;
    }
    const previousState = this.LearningWord.state;
    this.LearningWord.state = determineWordState(this.LearningWord);

    if (previousState !== this.LearningWord.state) {
      this.LearningWord.consecutiveCorrect = 0;
    }

    this.stateChanged = previousState !== this.LearningWord.state;
  }
}

