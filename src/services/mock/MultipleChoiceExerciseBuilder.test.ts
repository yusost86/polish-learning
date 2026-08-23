import { describe, expect, it } from "vitest";

import { ExerciseType } from "../../domain/enums/ExerciseType";
import { isContextExerciseTask, isProductionExerciseTask } from "../../domain/models/ExerciseTask";
import {
  buildContextTask,
  buildProductionTask,
  gradeForeignTermAnswer,
  maskForeignTerm,
} from "./ContextExerciseBuilder";
import { getMockWords, getMockWordsByTopic } from "./MockWordCatalog";
import { planSession } from "./MockSessionPlanner";
import {
  buildRecallTask,
  buildRecognitionTask,
  gradeChoiceExercise,
} from "./MultipleChoiceExerciseBuilder";

describe("MockSessionPlanner", () => {
  it("returns food words for topic new mode", () => {
    const words = planSession({ mode: "new", topicId: "food", limit: 5 });
    expect(words).toHaveLength(5);
    expect(words.every((word) => word.topicId === "food")).toBe(true);
    expect(words[0]?.term).toBe("jabłko");
  });

  it("returns a different slice for due mode", () => {
    const newWords = planSession({ mode: "new", topicId: "food", limit: 5 });
    const dueWords = planSession({ mode: "due", topicId: "food", limit: 5 });
    expect(dueWords[0]?.id).not.toBe(newWords[0]?.id);
  });

  it("returns a due slice when topicId is omitted", () => {
    const words = planSession({ mode: "due", limit: 5 });
    expect(words).toHaveLength(5);
    expect(words[0]?.term).not.toBe("jabłko");
  });
});

describe("ContextExerciseBuilder", () => {
  it("masks foreign term with underscores", () => {
    expect(maskForeignTerm("dworzec")).toBe("dw_r_e_");
    expect(maskForeignTerm("jabłko")).toBe("ja_ł_o");
  });

  it("builds context task from masked PL term", () => {
    const word = getMockWordsByTopic("food")[0];
    const task = buildContextTask(word);

    expect(isContextExerciseTask(task)).toBe(true);
    expect(task.expectedTerm).toBe(word.term);
    expect(task.prompt).toContain("_");
  });

  it("builds production task from UA prompt and PL answer", () => {
    const word = getMockWordsByTopic("food")[0];
    const task = buildProductionTask(word);

    expect(isProductionExerciseTask(task)).toBe(true);
    expect(task.prompt).toBe(word.translation);
    expect(task.expectedTerm).toBe(word.term);
  });

  it("grades typed foreign-term answers case-insensitively", () => {
    expect(gradeForeignTermAnswer("jabłko", "Jabłko")).toBe(true);
    expect(gradeForeignTermAnswer("jabłko", "chleb")).toBe(false);
  });
});

describe("MultipleChoiceExerciseBuilder", () => {
  it("builds recognition with PL prompt and UA choices", () => {
    const pool = getMockWordsByTopic("food");
    const word = pool[0];
    const task = buildRecognitionTask(word, pool);

    expect(task.exerciseType).toBe(ExerciseType.Recognition);
    expect(task.choices).toHaveLength(4);
    expect(new Set(task.choices.map((choice) => choice.label)).size).toBe(4);
    expect(task.prompt).toBe(word.term);
    expect(task.choices.some((choice) => choice.label === word.translation)).toBe(true);
  });

  it("builds recall with UA prompt and PL choices", () => {
    const pool = getMockWordsByTopic("food");
    const word = pool[0];
    const task = buildRecallTask(word, pool);

    expect(task.exerciseType).toBe(ExerciseType.Recall);
    expect(task.choices).toHaveLength(4);
    expect(task.prompt).toBe(word.translation);
    expect(task.choices.some((choice) => choice.label === word.term)).toBe(true);
  });

  it("grades choice answers", () => {
    const pool = getMockWords();
    const task = buildRecognitionTask(pool[0], pool);
    expect(gradeChoiceExercise(task, task.correctChoiceId)).toBe(true);
    expect(gradeChoiceExercise(task, "wrong-id")).toBe(false);
  });
});
