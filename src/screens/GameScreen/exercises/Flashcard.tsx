import { useState } from "react";

import { useExerciseState } from "../../../hooks/useExerciseState";
import { exerciseTypeTitle } from "../../../utils/exerciseUtils";
import { PromptCard } from "../PromptCard";
import { AttemptFooter } from "./AttemptFooter";
import { ExerciseModel } from "../../../domain/models/LessonModel";

export interface FlashcardProps {
  onContinue: (correct: boolean) => void;
  exercise:ExerciseModel
}

export function Flashcard({ onContinue, exercise }: FlashcardProps) {
  const attempt = useExerciseState({  exercise, onContinue });
  const [revealed, setRevealed] = useState(false);
  const disabled = attempt.phase === "feedback";

  return (
    <>
      <PromptCard
        label={exerciseTypeTitle(exercise.exerciseType)}
        prompt={revealed ? exercise.word.translation : exercise.word.term}
      />
      {!revealed ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setRevealed(true)}
          style={{
            padding: "13px 16px",
            borderRadius: "var(--radius-s)",
            background: "var(--gold)",
            color: "#2a1e0c",
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          Показати слово
        </button>
      ) : attempt.phase === "exercise" ? (
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={() => attempt.submitAnswer(exercise.correctAnswer)}
            style={{
              flex: 1,
              padding: "13px 16px",
              borderRadius: "var(--radius-s)",
              background: "rgba(111, 191, 154, 0.18)",
              border: "1px solid var(--good)",
              color: "var(--good)",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            Знаю
          </button>
          <button
            type="button"
            onClick={() => attempt.submitAnswer("")}
            style={{
              flex: 1,
              padding: "13px 16px",
              borderRadius: "var(--radius-s)",
              background: "rgba(224, 122, 99, 0.18)",
              border: "1px solid var(--bad)",
              color: "var(--bad)",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            Не знаю
          </button>
        </div>
      ) : null}
      <AttemptFooter
        attempt={attempt}
        correctAnswer={attempt.correctAnswer}
        showDevGrade={false}
      />
    </>
  );
}
