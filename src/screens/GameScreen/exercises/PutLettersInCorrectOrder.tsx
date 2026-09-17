import { useMemo, useState } from "react";

import { useExerciseState } from "../../../hooks/useExerciseState";
import { exerciseTypeTitle } from "../../../utils/exerciseUtils";
import { PromptCard } from "../PromptCard";
import { AttemptFooter } from "./AttemptFooter";
import { ExerciseModel } from "../../../domain/models/LessonModel";
import { shuffleLetters } from "../../../utils/exerciseUtils";

export interface PutLettersInCorrectOrderProps {
  devMode?: boolean;
  onContinue: (correct: boolean) => void;
  exercise:ExerciseModel
}

export function PutLettersInCorrectOrder({
  devMode = false,
  onContinue,
  exercise,
}: PutLettersInCorrectOrderProps) {
  const attempt = useExerciseState({ exercise, onContinue });
  const [usedIndices, setUsedIndices] = useState<number[]>([]);
  const shuffledLetters = useMemo(() => shuffleLetters(exercise.word.term), [exercise.word.term]);
  const disabled = attempt.phase === "feedback";

  function handlePick(index: number) {
    if (disabled || usedIndices.includes(index)) {
      return;
    }
    const next = [...usedIndices, index];
    setUsedIndices(next);
    if (next.length === shuffledLetters.length) {
      attempt.submitAnswer(next.map((letterIndex) => shuffledLetters[letterIndex]).join(""));
    }
  }

  function handleUndo() {
    if (disabled || usedIndices.length === 0) {
      return;
    }
    setUsedIndices(usedIndices.slice(0, -1));
  }

  return (
    <>
      <PromptCard label={exerciseTypeTitle(exercise.exerciseType)} prompt={attempt.prompt} />
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          justifyContent: "center",
          minHeight: 52,
          padding: "12px 10px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-m)",
        }}
      >
        {usedIndices.length === 0 ? (
          <span style={{ color: "var(--text-faint)", fontSize: 14 }}>Натискайте літери нижче</span>
        ) : (
          usedIndices.map((letterIndex, position) => (
            <button
              key={`${letterIndex}-${position}`}
              type="button"
              disabled={disabled}
              onClick={handleUndo}
              style={{
                minWidth: 36,
                padding: "10px 12px",
                borderRadius: "var(--radius-s)",
                background: "var(--surface-alt)",
                border: "1px solid var(--blue)",
                color: "var(--text)",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              {shuffledLetters[letterIndex]}
            </button>
          ))
        )}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {shuffledLetters.map((char, index) => {
          const used = usedIndices.includes(index);
          return (
            <button
              key={index}
              type="button"
              disabled={disabled || used}
              onClick={() => handlePick(index)}
              style={{
                minWidth: 40,
                padding: "12px 14px",
                borderRadius: "var(--radius-s)",
                background: used ? "var(--surface)" : "var(--surface-alt)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: 18,
                opacity: used ? 0.35 : 1,
              }}
            >
              {char}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        disabled={disabled || usedIndices.length === 0}
        onClick={handleUndo}
        style={{
          padding: "13px 16px",
          borderRadius: "var(--radius-s)",
          background: "transparent",
          border: "1px solid var(--border)",
          color: "var(--text)",
          fontWeight: 600,
          fontSize: 15,
        }}
      >
        Стерти
      </button>
      <AttemptFooter attempt={attempt} correctAnswer={attempt.correctAnswer} devMode={devMode} />
    </>
  );
}
