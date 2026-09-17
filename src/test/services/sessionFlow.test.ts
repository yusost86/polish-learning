import { beforeEach, describe, expect, it } from "vitest";

import type { StoredLearningWord } from "../../db/database";
import { ExerciseType } from "../../domain/enums/ExerciseType";
import { WordState } from "../../domain/enums/WordState";
import { LearningWordModel, createEmptyLearningWord } from "../../domain/models/LearningWordModel";
import { ExerciseModel } from "../../domain/models/LessonModel";
import { deserializeLearningWord } from "../../repositories/progressMapper";
import { initDexieLearningEngineForTests } from "../../services/learningEngineProvider";

describe("session flow", () => {
  beforeEach(async () => {
    await initDexieLearningEngineForTests();
  });

  it("saves progress after flashcard answer", async () => {
    const engine = await initDexieLearningEngineForTests();
    const lesson = await engine.getLesson({ topicId: "travel" });
    const exercises = lesson.GetExercises();
    expect(exercises.length).toBeGreaterThan(0);

    const exercise = exercises[0];
    exercise.answer(exercise.correctAnswer);
    await expect(engine.submitAnswer(exercise.LearningWord)).resolves.toBeUndefined();
  });

  it("advances New to Learning after flashcard and reloads persisted state", async () => {
    const engine = await initDexieLearningEngineForTests();
    const lesson = await engine.getLesson({ topicId: "travel" });
    const exercise = lesson.GetExercises()[0];
    const wordId = exercise.word.id;

    expect(exercise.exerciseType).toBe(ExerciseType.Flashcard);
    expect(exercise.LearningWord.LearningWord.state).toBe(WordState.New);

    exercise.answer(exercise.correctAnswer);
    expect(exercise.LearningWord.LearningWord.state).toBe(WordState.Learning);
    await engine.submitAnswer(exercise.LearningWord);

    const lesson2 = await engine.getLesson({ topicId: "travel" });
    const again = lesson2.GetExercises().find((item) => item.word.id === wordId);
    expect(again?.LearningWord.LearningWord.state).toBe(WordState.Learning);
    expect(again?.exerciseType).toBe(ExerciseType.NativeMultipleChoice);
  });

  it("defaults missing consecutiveCorrect from legacy progress rows", () => {
    const stored = {
      id: "travel:airport",
      wordId: "airport",
      topicId: "travel",
      state: WordState.New,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    } as StoredLearningWord;

    const learningWord = deserializeLearningWord(stored);
    expect(learningWord.consecutiveCorrect).toBe(0);

    const word = {
      id: "airport",
      term: "lotnisko",
      translation: "аеропорт",
      topicId: "travel",
    };
    const model = new LearningWordModel(learningWord, word, () => [word]);
    const flashcard = new ExerciseModel(ExerciseType.Flashcard, word, model);

    flashcard.answer(flashcard.correctAnswer);
    expect(model.LearningWord.state).toBe(WordState.Learning);
  });

  it("grades native multiple choice against the ukrainian translation", () => {
    const word = {
      id: "transport",
      term: "transport",
      translation: "транспорт",
      topicId: "daily-life",
    };
    const model = new LearningWordModel(
      createEmptyLearningWord(word.id, word.topicId, new Date()),
      word,
      () => [word],
    );
    const exercise = new ExerciseModel(ExerciseType.NativeMultipleChoice, word, model);

    expect(exercise.prompt).toBe(word.term);
    expect(exercise.answer(word.translation)).toBe(true);
    expect(exercise.answer(word.term)).toBe(false);
  });

  it("grades foreign multiple choice against the polish term", () => {
    const word = {
      id: "transport",
      term: "transport",
      translation: "транспорт",
      topicId: "daily-life",
    };
    const model = new LearningWordModel(
      createEmptyLearningWord(word.id, word.topicId, new Date()),
      word,
      () => [word],
    );
    const exercise = new ExerciseModel(ExerciseType.ForeignMultipleChoice, word, model);

    expect(exercise.prompt).toBe(word.translation);
    expect(exercise.answer(word.term)).toBe(true);
    expect(exercise.answer(word.translation)).toBe(false);
  });
});
