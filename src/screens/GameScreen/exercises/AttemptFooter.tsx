import { UseExerciseStateResult } from "../../../hooks/useExerciseState";
import { AnswerFeedback } from "../AnswerFeedback";
import { DevGradeButtons } from "../DevGradeButtons";

interface AttemptFooterProps {
  attempt: UseExerciseStateResult;
  correctAnswer: string;
  devMode?: boolean;
  showDevGrade?: boolean;
}

export function AttemptFooter({
  attempt,
  correctAnswer,
  devMode = false,
  showDevGrade = true,
}: AttemptFooterProps) {
  return (
    <>
      {devMode && showDevGrade && attempt.phase === "exercise" && (
        <DevGradeButtons onGrade={attempt.submitAnswer} correctAnswer={correctAnswer} />
      )}
      {attempt.phase === "feedback" && attempt.isCorrect !== null && (
        <AnswerFeedback
          isCorrect={attempt.isCorrect}
          correctAnswerLabel={correctAnswer}
          onContinue={attempt.handleContinue}
        />
      )}
    </>
  );
}
