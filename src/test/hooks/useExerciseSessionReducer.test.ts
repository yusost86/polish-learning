import { describe, expect, it } from "vitest";

import { ExerciseType } from "../../domain/enums/ExerciseType";
import { createEmptyLearningWord, LearningWordModel } from "../../domain/models/LearningWordModel";
import { ExerciseModel } from "../../domain/models/LessonModel";
import type { Word } from "../../domain/models/Word";

function buildExercise(id: string): ExerciseModel {
  const word: Word = {
    id,
    term: `term-${id}`,
    translation: `translation-${id}`,
    topicId: "travel",
  };
  const learningWord = new LearningWordModel(
    createEmptyLearningWord(id, "travel", new Date()),
    word,
    () => [word],
  );
  return new ExerciseModel(ExerciseType.Flashcard, word, learningWord);
}

describe("useExerciseSession reducer flow", () => {
  it("advances through the queue and completes the session", () => {
    const exercises = [buildExercise("a"), buildExercise("b"), buildExercise("c")];

    let queue = exercises.slice(1);
    let currentTask: ExerciseModel | null = exercises[0] ?? null;
    let phase: "exercise" | "complete" = exercises.length > 0 ? "exercise" : "complete";

    const advance = () => {
      if (phase !== "exercise") {
        return;
      }
      if (!queue.length) {
        currentTask = null;
        phase = "complete";
        return;
      }
      currentTask = queue[0];
      queue = queue.slice(1);
    };

    expect(currentTask?.word.id).toBe("a");
    advance();
    expect(currentTask?.word.id).toBe("b");
    advance();
    expect(currentTask?.word.id).toBe("c");
    advance();
    expect(currentTask).toBeNull();
    expect(phase).toBe("complete");
  });
});
