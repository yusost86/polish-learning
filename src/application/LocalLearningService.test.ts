import { describe, expect, it } from "vitest";

import { isChoiceExerciseTask, isTypedExerciseTask } from "../domain/models/ExerciseTask";
import { InMemoryLearningRepository } from "../repositories/InMemoryLearningRepository";
import { ALL_SCENARIO_WORDS } from "../test/fixtures/scenarioWords";
import { LocalLearningService } from "./LocalLearningService";

describe("LocalLearningService", () => {
  it("returns menu stats with topic names", async () => {
    const repository = new InMemoryLearningRepository(ALL_SCENARIO_WORDS);
    const service = new LocalLearningService({ repository });
    await service.initializeForTests(repository);

    const stats = await service.getMenuStats();
    const travel = stats.topics.find((topic) => topic.topicId === "travel");

    expect(travel?.name).toBe("Подорожі");
    expect(stats.totalUniqueWords).toBeGreaterThan(0);
  });

  it("starts and completes a learning session", async () => {
    const repository = new InMemoryLearningRepository(ALL_SCENARIO_WORDS);
    const service = new LocalLearningService({ repository });
    await service.initializeForTests(repository);

    const session = await service.startSession({ mode: "new", topicId: "food" });
    expect(session.tasks.length).toBeGreaterThan(0);
    expect(session.topicName).toBe("Їжа");

    const firstTask = session.tasks[0];
    const answer = isChoiceExerciseTask(firstTask)
      ? { type: "choice" as const, choiceId: firstTask.correctChoiceId }
      : isTypedExerciseTask(firstTask)
        ? { type: "typed" as const, text: firstTask.expectedTerm }
        : { type: "typed" as const, text: "" };

    const result = await service.submitAnswer({
      sessionId: session.sessionId,
      taskIndex: 0,
      answer,
      responseTimeMs: 1200,
    });

    expect(result.isCorrect).toBe(true);
    expect(result.nextTaskIndex).toBe(1);
  });

  it("lists topics for navigation", async () => {
    const repository = new InMemoryLearningRepository(ALL_SCENARIO_WORDS);
    const service = new LocalLearningService({ repository });
    await service.initializeForTests(repository);

    const topics = await service.getTopics();
    expect(topics.some((topic) => topic.topicId === "travel" && topic.name === "Подорожі")).toBe(
      true,
    );
  });
});
