// src/hooks/useLearningSession.ts

import { useCallback, useMemo, useState } from "react";

import { Rating, type Grade } from "ts-fsrs";

import { submitAnswer } from "../fsrs/review";
import { SessionQueue } from "../learning/session-queue";

import type { ExerciseType, StudentWord } from "../domain/types";

export interface SessionStats {
  answered: number;
  correct: number;
  total: number;
}

export function useLearningSession(initialCards: StudentWord[]) {
  const total = initialCards.length;

  const [queue] = useState(() => new SessionQueue(initialCards));
  const [currentCard, setCurrentCard] = useState<StudentWord | undefined>(() => queue.next());
  const [startTime, setStartTime] = useState(() => Date.now());
  const [stats, setStats] = useState<SessionStats>({ answered: 0, correct: 0, total });

  const answer = useCallback(
    async (grade: Grade, exerciseType: ExerciseType, isCorrect: boolean) => {
      if (!currentCard) return;

      const responseTimeMs = Date.now() - startTime;

      const updatedCard = await submitAnswer({
        studentWord: currentCard,
        exerciseType,
        grade,
        isCorrect,
        responseTimeMs,
      });

      if (grade === Rating.Again) {
        queue.requeueAfterError(updatedCard);
      }

      setStats((s) => ({
        answered: s.answered + 1,
        correct: s.correct + (isCorrect ? 1 : 0),
        total: grade === Rating.Again ? s.total + 1 : s.total,
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
