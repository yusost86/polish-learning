import { useState } from "react";

import { useExerciseState } from "../../../hooks/useExerciseState";
import { exerciseTypeTitle } from "../../../utils/exerciseUtils";
import { PromptCard } from "../PromptCard";
import { TypeInExerciseView } from "../TypeInExerciseView";
import { AttemptFooter } from "./AttemptFooter";
import { ExerciseModel } from "../../../domain/models/LessonModel";

export interface InputFullWordProps {
  devMode?: boolean;
  onContinue: (correct: boolean) => void;
  exercise:ExerciseModel
}

export function InputFullWord({
  devMode = false,
  onContinue,
  exercise,
}: InputFullWordProps) {
  const attempt = useExerciseState({ exercise,  onContinue });
  const [value, setValue] = useState("");

  return (
    <>
      <PromptCard label={exerciseTypeTitle(exercise.exerciseType)} prompt={attempt.prompt} />
      <TypeInExerciseView
        value={value}
        disabled={attempt.phase === "feedback"}
        onChange={setValue}
        onSubmit={() => attempt.submitAnswer(value)}
      />
      <AttemptFooter attempt={attempt} correctAnswer={attempt.correctAnswer} devMode={devMode} />
    </>
  );
}
