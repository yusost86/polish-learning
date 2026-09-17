import { useState } from "react";

import { useExerciseState } from "../../../hooks/useExerciseState";
import { exerciseTypeTitle } from "../../../utils/exerciseUtils";
import { MultipleChoiceExerciseView } from "../MultipleChoiceExerciseView";
import { PromptCard } from "../PromptCard";
import { AttemptFooter } from "./AttemptFooter";
import { ExerciseModel } from "../../../domain/models/LessonModel";

export interface ForeignMultipleChoiceProps {
  devMode?: boolean;
  onContinue: (correct: boolean) => void;
  exercise:ExerciseModel
}

export function ForeignMultipleChoice({
  devMode = false,
  onContinue,
  exercise,
}: ForeignMultipleChoiceProps) {
  const attempt = useExerciseState({ exercise, onContinue });
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const disabled = attempt.phase === "feedback";

  return (
    <>
      <PromptCard label={exerciseTypeTitle(exercise.exerciseType)} prompt={attempt.prompt} />
      <MultipleChoiceExerciseView
        choices={attempt.choices}
        selectedChoiceId={selectedChoiceId}
        correctChoiceId={attempt.phase === "feedback" ? attempt.correctAnswer : null}
        disabled={disabled}
        onSelect={(selectedChoice) => {
          const choice = attempt.choices.find((item) => item === selectedChoice);
          if (!choice) {
            return;
          }
          setSelectedChoiceId(selectedChoice);
          attempt.submitAnswer(selectedChoice);
        }}
      />
      <AttemptFooter attempt={attempt} correctAnswer={attempt.correctAnswer} devMode={devMode} />
    </>
  );
}
