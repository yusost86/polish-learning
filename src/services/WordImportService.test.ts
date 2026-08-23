import { describe, expect, it } from "vitest";

import type { Word } from "../domain/models/Word";
import {
  buildWordsForImport,
  parseWordImportJson,
  parseWordImportPayload,
} from "./WordImportService";
import { slugifyTopicId, slugifyWordId } from "../utils/wordTextUtils";

describe("WordImportService", () => {
  it("parses topic entries with single word object", () => {
    const parsed = parseWordImportJson(
      `[{"topic":"health","words":{"pl":"lekarz","ua":"лікар"}}]`,
    );
    expect(parsed.errors).toEqual([]);
    expect(parsed.entries).toHaveLength(1);
  });

  it("skips duplicates within the same topic", () => {
    const existingWords: Word[] = [
      { id: "health--lekarz", term: "lekarz", translation: "лікар", topicId: "health" },
    ];

    const built = buildWordsForImport({
      entries: [
        {
          topic: "health",
          words: [
            { pl: "lekarz", ua: "лікар" },
            { pl: "apteka", ua: "аптека" },
          ],
        },
      ],
      existingWords,
    });

    expect(built.wordsToAdd).toHaveLength(1);
    expect(built.wordsToAdd[0]?.term).toBe("apteka");
    expect(built.skippedDuplicates).toBe(1);
  });

  it("allows the same polish word in different topics", () => {
    const built = buildWordsForImport({
      entries: [
        { topic: "food", words: { pl: "menu", ua: "меню" } },
        { topic: "travel", words: { pl: "menu", ua: "меню" } },
      ],
      existingWords: [],
    });

    expect(built.wordsToAdd).toHaveLength(2);
    expect(new Set(built.wordsToAdd.map((word) => word.topicId)).size).toBe(2);
    expect(built.wordsToAdd.map((word) => word.id)).toEqual(["food--menu", "travel--menu"]);
  });

  it("imports valid words from a mixed words array", () => {
    const parsed = parseWordImportPayload([
      {
        topic: "health",
        words: [
          { pl: "apteka", ua: "аптека" },
          { pl: 123, ua: "bad" },
          { pl: "lekarz", ua: "лікар" },
        ],
      },
    ]);

    expect(parsed.errors).toHaveLength(1);
    expect(parsed.entries).toHaveLength(1);
    expect(parsed.entries[0]?.words).toEqual([
      { pl: "apteka", ua: "аптека" },
      { pl: "lekarz", ua: "лікар" },
    ]);
  });

  it("rejects polish terms that cannot produce a word id", () => {
    const built = buildWordsForImport({
      entries: [{ topic: "health", words: { pl: "!!!", ua: "тест" } }],
      existingWords: [],
    });

    expect(built.wordsToAdd).toHaveLength(0);
    expect(built.errors.some((error) => error.includes("pl"))).toBe(true);
    expect(Object.keys(built.topicNames)).toHaveLength(0);
  });

  it("does not create orphan topics when all words are invalid", () => {
    const built = buildWordsForImport({
      entries: [
        {
          topic: "health",
          words: [
            { pl: "   ", ua: "лікар" },
            { pl: "!!!", ua: "тест" },
          ],
        },
      ],
      existingWords: [],
    });

    expect(built.wordsToAdd).toHaveLength(0);
    expect(Object.keys(built.topicNames)).toHaveLength(0);
    expect(built.errors.length).toBeGreaterThan(0);
  });

  it("slugifies cyrillic topic names", () => {
    expect(slugifyTopicId("Здоров'я")).toBe("здоровя");
    const built = buildWordsForImport({
      entries: [{ topic: "Здоров'я", words: { pl: "lekarz", ua: "лікар" } }],
      existingWords: [],
    });

    expect(built.wordsToAdd[0]?.topicId).toBe("здоровя");
    expect(built.topicNames["здоровя"]).toBe("Здоров'я");
  });

  it("disambiguates word ids using slugified translation", () => {
    const existingWords: Word[] = [
      { id: "food--bank", term: "bank", translation: "банк", topicId: "food" },
    ];

    const built = buildWordsForImport({
      entries: [{ topic: "food", words: { pl: "bank", ua: "берег" } }],
      existingWords,
    });

    expect(built.wordsToAdd).toHaveLength(1);
    expect(built.wordsToAdd[0]?.id).toBe("food--bank-берег");
  });
});

describe("wordTextUtils slugify", () => {
  it("keeps cyrillic letters in word slugs", () => {
    expect(slugifyWordId("лікар")).toBe("лікар");
  });
});
