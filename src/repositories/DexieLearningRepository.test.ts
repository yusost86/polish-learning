import { describe, expect, it } from "vitest";

import { DEFAULT_STUDENT_ID } from "../data/wordCatalog";
import { ExerciseType } from "../domain/enums/ExerciseType";
import { WordState } from "../domain/enums/WordState";
import { LearningEngine } from "../services/LearningEngine";
import { DexieLearningRepository } from "./DexieLearningRepository";

describe("DexieLearningRepository", () => {
  it("persists word progress across repository instances", async () => {
    const repository = new DexieLearningRepository();
    await repository.initialize();
    const engine = new LearningEngine(repository);

    await engine.getNextTasks(DEFAULT_STUDENT_ID, { topicId: "travel", mode: "new" });
    await engine.submitAnswer({
      studentId: DEFAULT_STUDENT_ID,
      wordId: "airport",
      exerciseType: ExerciseType.Recognition,
      correct: true,
      responseTimeMs: 2500,
    });

    const reloaded = new DexieLearningRepository();
    const saved = await reloaded.getProgress(DEFAULT_STUDENT_ID, "airport");
    expect(saved?.totalAttempts).toBe(1);
    expect(saved?.state).toBe(WordState.Learning);
  });
});
