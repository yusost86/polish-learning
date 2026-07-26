import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../db/db";
import { createStudentWord } from "../fsrs/create-card";
import { buildSession } from "./session";

beforeEach(async () => { await Promise.all([db.topics.clear(), db.words.clear(), db.studentWords.clear(), db.reviewEvents.clear()]); });
describe("buildSession", () => {
  it("includes a multi-topic word in each topic session", async () => {
    await db.topics.bulkAdd([{ id: "a", name: "A", createdAt: "now" }, { id: "b", name: "B", createdAt: "now" }]);
    await db.words.add({ id: "w", foreignText: "pies", nativeText: "собака", topicId: "a", topicIds: ["a", "b"], importance: 1, exerciseTypes: [], createdAt: "now" });
    const card = createStudentWord("s", "w"); card.fsrsCard.due = new Date("2000-01-01"); await db.studentWords.add(card);
    expect((await buildSession({ studentId: "s", topicId: "a", mode: "due" })).reviewCards).toHaveLength(1);
    expect((await buildSession({ studentId: "s", topicId: "b", mode: "due" })).reviewCards).toHaveLength(1);
  });
});
