import { ExerciseType } from "../../../domain/enums/ExerciseType";
import { ExerciseModel } from "../../../domain/models/LessonModel";
import { Flashcard } from "./Flashcard";
import { ForeignMultipleChoice } from "./ForeignMultipleChoice";
import { InputFullWord } from "./InputFullWord";
import { NativeMultipleChoice } from "./NativeMultipleChoice";
import { PutLettersInCorrectOrder } from "./PutLettersInCorrectOrder";
import { PutMissingLettersInGaps } from "./PutMissingLettersInGaps";

export interface ActiveExerciseProps {
  devMode?: boolean;
  onContinue: (correct: boolean) => void;
  exercise:ExerciseModel
}

export function ActiveExercise({
  devMode = false,
  onContinue,
  exercise,
}: ActiveExerciseProps) {
  switch (exercise.exerciseType) {
    case ExerciseType.Flashcard:
      return <Flashcard exercise={exercise} onContinue={onContinue} />;
    case ExerciseType.NativeMultipleChoice:
      return (
        <NativeMultipleChoice
          exercise={exercise}
          devMode={devMode}
          onContinue={onContinue}
        />
      );
    case ExerciseType.ForeignMultipleChoice:
      return (
        <ForeignMultipleChoice
          exercise={exercise}
          devMode={devMode}
          onContinue={onContinue}
        />
      );
    case ExerciseType.PutLettersInCorrectOrder:
      return (
        <PutLettersInCorrectOrder
          exercise={exercise}
          devMode={devMode}
          onContinue={onContinue}
        />
      );
    case ExerciseType.PutMissingLettersInGaps:
      return (
        <PutMissingLettersInGaps
           exercise={exercise}
          devMode={devMode}
          onContinue={onContinue}
        />
      );
    case ExerciseType.InputFullWord:
      return (
        <InputFullWord
          devMode={devMode}
          onContinue={onContinue}
          exercise={exercise}
        />
      );
    default: {
      return null;
    }
  }
}
