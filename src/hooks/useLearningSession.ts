// src/hooks/useLearningSession.ts

import { useCallback, useMemo, useState } from "react";

import { db } from "../db/db";
import { gradeMultipleChoice, toFsrsRating } from "../features/learning/fsrs/fsrsAdapter";
import { submitAnswer as submitLearningAnswer } from "../features/learning/learningEngine";
import type { ExerciseType as LearningExerciseType, Word as LearningWord, WordLearningStats } from "../features/learning/types";
import { SessionQueue } from "../learning/session-queue";

import type { ExerciseType, LearningProgress, StudentWord, Word } from "../domain/types";

export interface SessionStats {
  answered: number;
  correct: number;
  total: number;
}

const DEFAULT_PROGRESS: LearningProgress = {
  skills: { recognition: 0, recall: 0, production: 0, context: 0 },
  mastery: 0,
  weakestSkill: "recognition",
  state: "new",
  attempts: 0,
  correctAnswers: 0,
  wrongAnswers: 0,
  correctStreak: 0,
  averageResponseTimeMs: 0,
};

function toLearningWord(word: Word): LearningWord {
  return {
    id: word.id,
    term: word.foreignText,
    translation: word.nativeText,
    topicId: word.topicId,
    subtopicId: word.subtopicId,
    priority: word.importance,
  };
}

function toLearningStats(card: StudentWord, word: Word): WordLearningStats {
  const progress = card.learningProgress ?? DEFAULT_PROGRESS;
  const createdAt = new Date(card.createdAt);
  const updatedAt = new Date(card.updatedAt);

  return {
    wordId: card.wordId,
    studentId: card.studentId,
    topicId: word.topicId,
    subtopicId: word.subtopicId,
    state: progress.state,
    skills: { ...progress.skills },
    mastery: progress.mastery,
    weakestSkill: progress.weakestSkill,
    attempts: progress.attempts,
    correctAnswers: progress.correctAnswers,
    wrongAnswers: progress.wrongAnswers,
    correctStreak: progress.correctStreak,
    averageResponseTimeMs: progress.averageResponseTimeMs,
    lastExerciseType: progress.lastExerciseType,
    lastCorrect: progress.lastCorrect,
    fsrsCard: card.fsrsCard,
    lastReviewedAt: progress.lastReviewedAt ? new Date(progress.lastReviewedAt) : undefined,
    nextReviewAt: progress.nextReviewAt ? new Date(progress.nextReviewAt) : card.fsrsCard.due,
    createdAt: Number.isNaN(createdAt.getTime()) ? new Date() : createdAt,
    updatedAt: Number.isNaN(updatedAt.getTime()) ? new Date() : updatedAt,
  };
}

function toStoredProgress(stats: WordLearningStats): LearningProgress {
  return {
    skills: stats.skills,
    mastery: stats.mastery,
    weakestSkill: stats.weakestSkill,
    state: stats.state,
    attempts: stats.attempts,
    correctAnswers: stats.correctAnswers,
    wrongAnswers: stats.wrongAnswers,
    correctStreak: stats.correctStreak,
    averageResponseTimeMs: stats.averageResponseTimeMs,
    lastExerciseType: stats.lastExerciseType,
    lastCorrect: stats.lastCorrect,
    lastReviewedAt: stats.lastReviewedAt?.toISOString(),
    nextReviewAt: stats.nextReviewAt?.toISOString(),
  };
}

export function useLearningSession(initialCards: StudentWord[]) {
  const total = initialCards.length;

  const [queue] = useState(() => new SessionQueue(initialCards));
  const [currentCard, setCurrentCard] = useState<StudentWord | undefined>(() => queue.next());
  const [startTime, setStartTime] = useState(() => Date.now());
  const [stats, setStats] = useState<SessionStats>({ answered: 0, correct: 0, total });

  const answer = useCallback(
    async ({ word, learningExerciseType, exerciseType, isCorrect }: {
      word: Word;
      learningExerciseType: LearningExerciseType;
      exerciseType: ExerciseType;
      isCorrect: boolean;
    }) => {
      if (!currentCard) return;

      const responseTimeMs = Date.now() - startTime;

      const previousStats = toLearningStats(currentCard, word);
      const result = submitLearningAnswer({
        word: toLearningWord(word),
        stats: previousStats,
        exerciseType: learningExerciseType,
        correct: isCorrect,
        responseTimeMs,
      });
      const grade = gradeMultipleChoice(isCorrect, responseTimeMs, previousStats.correctStreak);
      const updatedCard: StudentWord = {
        ...currentCard,
        fsrsCard: result.updatedStats.fsrsCard,
        correctCount: result.updatedStats.correctAnswers,
        incorrectCount: result.updatedStats.wrongAnswers,
        consecutiveCorrect: result.updatedStats.correctStreak,
        consecutiveIncorrect: isCorrect ? 0 : currentCard.consecutiveIncorrect + 1,
        averageResponseTimeMs: result.updatedStats.averageResponseTimeMs,
        lastExerciseType: exerciseType,
        learningProgress: toStoredProgress(result.updatedStats),
        updatedAt: result.updatedStats.updatedAt.toISOString(),
      };

      await db.transaction("rw", db.studentWords, db.reviewEvents, async () => {
        await db.studentWords.put(updatedCard);
        await db.reviewEvents.add({
          id: crypto.randomUUID(),
          wordId: currentCard.wordId,
          timestamp: new Date().toISOString(),
          exerciseType,
          grade: toFsrsRating(grade),
          isCorrect,
          responseTimeMs,
        });
      });

      if (grade === "again") {
        queue.requeueAfterError(updatedCard);
      }

      setStats((s) => ({
        answered: s.answered + 1,
        correct: s.correct + (isCorrect ? 1 : 0),
        total: grade === "again" ? s.total + 1 : s.total,
      }));

      const next = queue.next();
      setCurrentCard(next);
      setStartTime(Date.now());
    },
    [currentCard, startTime, queue],
  );

  const remaining = useMemo(() => queue.length + (currentCard ? 1 : 0), [queue, currentCard]);

  return {
    currentCard,
    answer,
    stats,
    remaining,
    isFinished: !currentCard,
  };
}
