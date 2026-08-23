import { Grade } from "../enums/Grade";
import { WordState } from "../enums/WordState";
import type { WordProgress } from "./WordProgress";

export interface AnswerResult {
  grade: Grade;
  progress: WordProgress;
  mastery: number;
  state: WordState;
}
