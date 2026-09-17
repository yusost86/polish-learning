import { useCallback, useMemo, useRef, useState } from "react";

import { ExerciseModel } from "../domain/models/LessonModel";

export type ExerciseAttemptPhase = "exercise" | "feedback";

export interface UseExerciseStateParams {
  onContinue: (correct: boolean) => void;
  exercise:ExerciseModel
}

export interface UseExerciseStateResult {
  phase: ExerciseAttemptPhase;
  isCorrect: boolean | null;
  submitAnswer: (answer: string) => void;
  handleContinue: () => void;
  choices: string[];
  prompt: string;
  correctAnswer: string;
}

/** Local attempt state. Persist happens only when the learner taps Continue. */
export function useExerciseState({
  onContinue,
  exercise,
}: UseExerciseStateParams): UseExerciseStateResult {
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null); 
 
  const exerciseRef = useRef<ExerciseModel>(exercise);

  const submitAnswer = useCallback(
    (answer: string) => {
      setIsCorrect(exerciseRef.current.answer(answer));
    },
    [],
  );

  const choices = useMemo(() => exerciseRef.current.getPossibleAnswers(), [exercise]);

  const handleContinue = useCallback(() => {
    onContinue(isCorrect ?? false);
  }, [isCorrect, onContinue]);

  return {
    isCorrect,
    submitAnswer,
    choices,
    prompt: exerciseRef.current.prompt,
    handleContinue: handleContinue,

    phase: isCorrect !== null ? "feedback" : "exercise",
    correctAnswer: exerciseRef.current.correctAnswer,
  };
}
