// src/db/db.ts

import Dexie, { type Table } from "dexie";

import type { Topic, Subtopic, Word, StudentWord, ReviewEvent } from "../domain/types";

export class VocabularyDatabase extends Dexie {
  topics!: Table<Topic, string>;
  subtopics!: Table<Subtopic, string>;
  words!: Table<Word, string>;
  studentWords!: Table<StudentWord, string>;
  reviewEvents!: Table<ReviewEvent, string>;

  constructor() {
    super("VocabularyDB");

    this.version(1).stores({
      topics: "id, name",
      subtopics: "id, topicId",
      words: "id, topicId, subtopicId",
      studentWords: "id, studentId, wordId",
      reviewEvents: "id, wordId, timestamp",
    });
  }
}

export const db = new VocabularyDatabase();

// Single-device local learner id. This app has no accounts/auth, so we use
// one fixed student id for all local progress.
export const LOCAL_STUDENT_ID = "local-student";
