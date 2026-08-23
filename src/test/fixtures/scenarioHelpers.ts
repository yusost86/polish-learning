import { createEmptyCard, State, type Card } from "ts-fsrs";

import { WordState } from "../../domain/enums/WordState";
import type { SkillProgress } from "../../domain/models/SkillProgress";
import { createEmptyWordProgress, type WordProgress } from "../../domain/models/WordProgress";
import topicAIter1Before from "./scenarios/topic-a-iter1-before.json";

export interface ScenarioWordSnapshot {
  wordId: string;
  state: string;
  mastery: number;
  skills: {
    recognition: number;
    recall: number;
    production: number;
    context: number;
  };
  errorCount: number;
  consecutiveErrors?: number;
  consecutiveCorrect?: number;
  fsrsDue: string | null;
}

export interface ScenarioSnapshot {
  studentId: string;
  topicId: string;
  now: string;
  words: ScenarioWordSnapshot[];
}

function skillFromMastery(value: number): SkillProgress {
  return { mastery: value, correct: 0, attempts: 0 };
}

function cardFromDue(fsrsDue: string | null, now: Date): Card {
  const card = createEmptyCard(now);
  if (fsrsDue) {
    card.due = new Date(fsrsDue);
    card.state = State.Review;
    card.reps = 1;
  }
  return card;
}

export function progressFromSnapshot(
  studentId: string,
  snapshot: ScenarioWordSnapshot,
  now: Date,
): WordProgress {
  const progress = createEmptyWordProgress(
    studentId,
    snapshot.wordId,
    now,
    cardFromDue(snapshot.fsrsDue, now),
  );

  progress.state = snapshot.state as WordState;
  progress.recognition = skillFromMastery(snapshot.skills.recognition);
  progress.recall = skillFromMastery(snapshot.skills.recall);
  progress.production = skillFromMastery(snapshot.skills.production);
  progress.context = skillFromMastery(snapshot.skills.context);
  progress.errorCount = snapshot.errorCount;
  progress.consecutiveErrors = snapshot.consecutiveErrors ?? 0;
  progress.consecutiveCorrect = snapshot.consecutiveCorrect ?? 0;
  progress.totalAttempts = snapshot.state === WordState.New ? 0 : 1;
  progress.fsrsCard = cardFromDue(snapshot.fsrsDue, now);

  return progress;
}

export function seedTopicAIter1Before(studentId: string, now: Date): WordProgress[] {
  const snapshot = topicAIter1Before as ScenarioSnapshot;
  return snapshot.words.map((word) => progressFromSnapshot(studentId, word, now));
}

export { topicAIter1Before };
