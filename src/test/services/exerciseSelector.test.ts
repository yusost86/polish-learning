import { describe, expect, it } from "vitest";

import { ExerciseType } from "../../domain/enums/ExerciseType";
import { WordState } from "../../domain/enums/WordState";
import { createEmptyLearningWord } from "../../domain/models/LearningWordModel";
import { selectExerciseType } from "../../services/ExerciseSelector";

function learningWord(state: WordState, consecutiveCorrect: number) {
  const progress = createEmptyLearningWord("word", "topic", new Date());
  progress.state = state;
  progress.consecutiveCorrect = consecutiveCorrect;
  return progress;
}

describe("selectExerciseType", () => {
  it("returns Flashcard for New", () => {
    expect(selectExerciseType(learningWord(WordState.New, 0))).toBe(ExerciseType.Flashcard);
  });

  it("returns InputFullWord for Mature", () => {
    expect(selectExerciseType(learningWord(WordState.Mature, 0))).toBe(ExerciseType.InputFullWord);
  });

  describe("Learning", () => {
    it("returns Foreign MC when consecutiveCorrect is below 2", () => {
      expect(selectExerciseType(learningWord(WordState.Learning, 0))).toBe(
        ExerciseType.ForeignMultipleChoice,
      );
      expect(selectExerciseType(learningWord(WordState.Learning, 1))).toBe(
        ExerciseType.ForeignMultipleChoice,
      );
    });

    it("returns Native MC when consecutiveCorrect is 2 or more", () => {
      expect(selectExerciseType(learningWord(WordState.Learning, 2))).toBe(
        ExerciseType.NativeMultipleChoice,
      );
      expect(selectExerciseType(learningWord(WordState.Learning, 3))).toBe(
        ExerciseType.NativeMultipleChoice,
      );
    });
  });

  describe("Consolidating", () => {
    it("returns missing-letter gaps when consecutiveCorrect is below 2", () => {
      expect(selectExerciseType(learningWord(WordState.Consolidating, 0))).toBe(
        ExerciseType.PutMissingLettersInGaps,
      );
      expect(selectExerciseType(learningWord(WordState.Consolidating, 1))).toBe(
        ExerciseType.PutMissingLettersInGaps,
      );
    });

    it("returns put letters when consecutiveCorrect is 2 or more", () => {
      expect(selectExerciseType(learningWord(WordState.Consolidating, 2))).toBe(
        ExerciseType.PutLettersInCorrectOrder,
      );
      expect(selectExerciseType(learningWord(WordState.Consolidating, 3))).toBe(
        ExerciseType.PutLettersInCorrectOrder,
      );
    });
  });

  describe("Relearning", () => {
    it("starts with put letters when history is empty", () => {
      expect(selectExerciseType(learningWord(WordState.Relearning, 0))).toBe(
        ExerciseType.PutLettersInCorrectOrder,
      );
    });

    it("cycles to the next exercise after the most recent entry", () => {
      const progress = learningWord(WordState.Relearning, 0);
      progress.wordProgressEntries.push({
        isCorrect: true,
        createdAt: new Date(),
        exercise: ExerciseType.PutLettersInCorrectOrder,
        state: WordState.Relearning,
      });

      expect(selectExerciseType(progress)).toBe(ExerciseType.PutMissingLettersInGaps);
    });
  });
});
