import { describe, expect, it } from "vitest";

import { ExerciseType } from "../domain/enums/ExerciseType";
import { Grade } from "../domain/enums/Grade";
import { WordState } from "../domain/enums/WordState";
import { InMemoryLearningRepository } from "../repositories/InMemoryLearningRepository";
import { LearningEngine } from "./LearningEngine";
import {
  ALL_SCENARIO_WORDS,
  SCENARIO_NOW,
  SCENARIO_STUDENT_ID,
  TRAVEL_WORDS,
} from "../test/fixtures/scenarioWords";
import { seedTopicAIter1Before } from "../test/fixtures/scenarioHelpers";

describe("LearningEngine", () => {
  it("returns 10 recognition tasks on Topic A cold start", async () => {
    const repo = new InMemoryLearningRepository(TRAVEL_WORDS);
    const engine = new LearningEngine(repo);
    engine.setNow(SCENARIO_NOW);

    const tasks = await engine.getNextTasks(SCENARIO_STUDENT_ID, "travel");
    expect(tasks).toHaveLength(10);
    expect(tasks.every((t) => t.exercise === ExerciseType.Recognition)).toBe(true);
  });

  it("updates mastery and state after answer (Topic A S1 after-states)", async () => {
    const repo = new InMemoryLearningRepository(ALL_SCENARIO_WORDS);
    const engine = new LearningEngine(repo);
    engine.setNow(SCENARIO_NOW);

    for (const progress of seedTopicAIter1Before(SCENARIO_STUDENT_ID, SCENARIO_NOW)) {
      repo.seedProgress(progress);
    }

    const cases = [
      { wordId: "boarding-pass", exerciseType: ExerciseType.Recall, correct: true, responseTimeMs: 2500, expectedMastery: 0.38, expectedState: WordState.Learning },
      { wordId: "gate", exerciseType: ExerciseType.Recognition, correct: false, responseTimeMs: 3000, expectedMastery: 0, expectedState: WordState.Relearning },
      { wordId: "luggage", exerciseType: ExerciseType.Recognition, correct: true, responseTimeMs: 2400, expectedMastery: 0.12, expectedState: WordState.Learning },
    ] as const;

    for (const testCase of cases) {
      const result = await engine.submitAnswer({
        studentId: SCENARIO_STUDENT_ID,
        wordId: testCase.wordId,
        exerciseType: testCase.exerciseType,
        correct: testCase.correct,
        responseTimeMs: testCase.responseTimeMs,
      });

      expect(result.grade).toBe(testCase.correct ? Grade.Good : Grade.Again);
      expect(result.mastery).toBeCloseTo(testCase.expectedMastery, 1);
      expect(result.state).toBe(testCase.expectedState);
    }
  });

  it("persists progress after submitAnswer", async () => {
    const repo = new InMemoryLearningRepository(TRAVEL_WORDS);
    const engine = new LearningEngine(repo);
    engine.setNow(SCENARIO_NOW);

    await engine.getNextTasks(SCENARIO_STUDENT_ID, "travel");
    await engine.submitAnswer({
      studentId: SCENARIO_STUDENT_ID,
      wordId: "airport",
      exerciseType: ExerciseType.Recognition,
      correct: true,
      responseTimeMs: 3200,
    });

    const saved = await engine.getWordProgress(SCENARIO_STUDENT_ID, "airport");
    expect(saved.totalAttempts).toBe(1);
    expect(saved.state).toBe(WordState.Learning);
  });
});
