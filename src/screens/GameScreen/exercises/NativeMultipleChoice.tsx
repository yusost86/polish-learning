import { useState } from "react";

import { useExerciseState } from "../../../hooks/useExerciseState";
import { exerciseTypeTitle } from "../../../utils/exerciseUtils";
import { MultipleChoiceExerciseView } from "../MultipleChoiceExerciseView";
import { PromptCard } from "../PromptCard";
import { AttemptFooter } from "./AttemptFooter";
import { ExerciseModel } from "../../../domain/models/LessonModel";

export interface NativeMultipleChoiceProps {
  devMode?: boolean;
  onContinue: (correct: boolean) => void;
  exercise:ExerciseModel
}

export function NativeMultipleChoice({
  devMode = false,
  onContinue,
  exercise,
}: NativeMultipleChoiceProps) {
  const attempt = useExerciseState({ exercise, onContinue });
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);

  return (
    <>
      <PromptCard label={exerciseTypeTitle(exercise.exerciseType)} prompt={attempt.prompt} />
      <MultipleChoiceExerciseView
        choices={attempt.choices}
        selectedChoiceId={selectedChoiceId}
        correctChoiceId={attempt.phase === "feedback" ? attempt.correctAnswer : null}
        disabled={attempt.phase === "feedback"}
        onSelect={(choiceId) => {
          const choice = attempt.choices.find((item) => item === choiceId);
          if (!choice) {
            return;
          }
          setSelectedChoiceId(choiceId);
          attempt.submitAnswer(choice);
        }}
      />
      <AttemptFooter attempt={attempt} correctAnswer={attempt.correctAnswer} devMode={devMode} />
    </>
  );
}
