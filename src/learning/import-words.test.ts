import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../db/db";
import { analyzeImport, commitImport, parseImportEntries } from "./import-words";

beforeEach(async () => { await Promise.all([db.topics.clear(), db.words.clear(), db.studentWords.clear(), db.reviewEvents.clear()]); });
describe("import words", () => {
  it("validates the new topic/words format including ua and part of speech", () => {
    expect(parseImportEntries(JSON.stringify({ topic: "Їжа", words: [{ pl: "jabłko", ua: "яблуко", "частина_мови": "іменник" }] }))).toEqual([
      { topic: "Їжа", pl: "jabłko", ua: "яблуко", partOfSpeech: "іменник" },
    ]);
  });
  it("finds duplicates independently of their current topic", async () => {
    await db.words.add({ id: "w", foreignText: "pies", nativeText: "собака", topicId: "old", importance: 1, exerciseTypes: [], createdAt: "now" });
    const result = await analyzeImport([{ topic: "Тварини", pl: "pies", ua: "собака" }, { topic: "Їжа", pl: "chleb", ua: "хліб" }]);
    expect(result.duplicates).toHaveLength(1); expect(result.newEntries).toHaveLength(1);
  });
  it("updates duplicate metadata for keep-incoming and leaves it for keep-existing", async () => {
    await db.topics.add({ id: "old", name: "Старе", createdAt: "now" });
    await db.words.add({ id: "w", foreignText: "pies", nativeText: "собака", topicId: "old", importance: 1, exerciseTypes: [], createdAt: "now" });
    const analysis = await analyzeImport([{ topic: "Нове", pl: "pies", ua: "собака", partOfSpeech: "іменник" }]);
    await commitImport(analysis, "keep-existing");
    expect((await db.words.get("w"))?.partOfSpeech).toBeUndefined();
    await commitImport(analysis, "keep-incoming");
    expect((await db.words.get("w"))?.partOfSpeech).toBe("іменник");
    expect((await db.words.get("w"))?.topicIds).toContain("old");
  });
  it("creates a new word", async () => {
    const analysis = await analyzeImport([{ topic: "Їжа", pl: "chleb", ua: "хліб" }]);
    const result = await commitImport(analysis, "keep-incoming");
    expect(result).toMatchObject({ topicsCreated: 1, wordsCreated: 1 });
  });
});
