import Dexie, { type EntityTable } from "dexie";

import type { WordState } from "../domain/enums/WordState";
import { ExerciseType } from "../domain/enums/ExerciseType";

type PartOfSpeech = "noun" | "verb" | "adjective" | "adverb" | "pronoun" | "preposition" | "conjunction" | "interjection";

type Language = "ukrainian" | "polish" | "english ";

type StoredWordTranslation = {
  language: Language;
  wordId: string;
}

export interface StoredWord {
  id: string;
  term: string;
  partOfSpeech: PartOfSpeech;
  language: Language;
  translation: StoredWordTranslation[];
}

export interface StoredWordProgressEntry  {
  isCorrect: boolean;
  createdAt: string;
  exercise: ExerciseType,
  state: WordState,
}

export interface StoredLearningWord {
  id: string;
  wordId: string;
  topicId: string;
  state: WordState;
  consecutiveCorrect: number;
  createdAt: string;
  updatedAt: string;
  wordProgressEntries: StoredWordProgressEntry[];
}

export interface StoredTopic {
  id: string;
  name: string;
  language: Language;
  wordProgress: StoredLearningWord[];
}

export class LearningDatabase extends Dexie {
  words!: EntityTable<StoredWord, "id">;
  topics!: EntityTable<StoredTopic, "id">;

  constructor() {
    super("PolishLearning");
    this.version(1).stores({
      words: "id, language",
      topics: "id, language",
    });
  }
}

export const db = new LearningDatabase();
