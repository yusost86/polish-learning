import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { useExerciseState } from "../../../hooks/useExerciseState";
import { buildGapSlots, exerciseTypeTitle } from "../../../utils/exerciseUtils";
import { PromptCard } from "../PromptCard";
import { AttemptFooter } from "./AttemptFooter";
import { ExerciseModel } from "../../../domain/models/LessonModel";

export interface PutMissingLettersInGapsProps {
  devMode?: boolean;
  onContinue: (correct: boolean) => void;
  exercise: ExerciseModel
}

export function PutMissingLettersInGaps({
  devMode = false,
  onContinue,
  exercise,
}: PutMissingLettersInGapsProps) {
  const attempt = useExerciseState({ exercise, onContinue });
  const slots = useMemo(() => buildGapSlots(exercise.word.term), [exercise.word.term]);

  const [values, setValues] = useState<string[]>(() => slots.map((slot) => (slot.hidden ? "" : slot.char)));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const disabled = attempt.phase === "feedback";

  useEffect(() => {
    setValues(slots.map((slot) => (slot.hidden ? "" : slot.char)));
  }, [slots]);

  const hiddenIndices = slots.flatMap((slot, index) => (slot.hidden ? [index] : []));
  const filled = hiddenIndices.every((index) => values[index]?.trim());

  function focusHidden(index: number) {
    inputRefs.current[index]?.focus();
  }

  function handleChange(index: number, raw: string) {
    if (disabled) {
      return;
    }
    const chars = Array.from(raw);
    const char = chars.length === 0 ? "" : chars[chars.length - 1];
    const next = [...values];
    next[index] = char;
    setValues(next);
    if (char) {
      const nextHidden = hiddenIndices.find((hiddenIndex) => hiddenIndex > index);
      if (nextHidden !== undefined) {
        focusHidden(nextHidden);
      }
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && filled) {
      attempt.submitAnswer(values.join(""));
      return;
    }
    if (event.key === "Backspace" && !values[index]) {
      const previousHidden = [...hiddenIndices].reverse().find((hiddenIndex) => hiddenIndex < index);
      if (previousHidden !== undefined) {
        focusHidden(previousHidden);
      }
    }
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
          padding: "16px 12px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-l)",
        }}
      >
        {slots.map((slot, index) =>
          slot.hidden ? (
            <input
              key={index}
              ref={(node) => {
                inputRefs.current[index] = node;
              }}
              type="text"
              value={values[index] ?? ""}
              disabled={disabled}
              maxLength={1}
              aria-label={`Літера ${index + 1}`}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              onChange={(event) => handleChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              style={{
                width: 40,
                height: 48,
                textAlign: "center",
                fontFamily: "var(--font-mono)",
                fontSize: 20,
                fontWeight: 700,
                borderRadius: "var(--radius-s)",
                border: "1px solid var(--gold)",
                background: "var(--surface-alt)",
                color: "var(--text)",
              }}
            />
          ) : (
            <span
              key={index}
              style={{
                width: 40,
                height: 48,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-mono)",
                fontSize: 20,
                fontWeight: 700,
                color: "var(--text)",
              }}
            >
              {slot.char}
            </span>
          ),
        )}
      </div>
      <button
        type="button"
        disabled={disabled || !filled}
        onClick={() => attempt.submitAnswer(values.join(""))}
        style={{
          padding: "13px 16px",
          borderRadius: "var(--radius-s)",
          background: "var(--gold)",
          color: "#2a1e0c",
          fontWeight: 700,
          fontSize: 15,
        }}
      >
        Перевірити
      </button>
      <AttemptFooter attempt={attempt} correctAnswer={attempt.correctAnswer} devMode={devMode} />
    </>
  );
}
