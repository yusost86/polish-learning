import type { Word } from "../domain/models/Word";
import type { WordImportEntry, WordImportPair, WordImportResult } from "../domain/models/WordImport";
import {
  buildWordId,
  normalizeWordText,
  slugifyTopicId,
  slugifyWordId,
  wordDedupKey,
} from "../utils/wordTextUtils";

function isWordPair(value: unknown): value is WordImportPair {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.pl === "string" && typeof record.ua === "string";
}

function extractWordPairs(words: WordImportEntry["words"]): WordImportPair[] {
  if (Array.isArray(words)) {
    return words;
  }
  return [words];
}

function isWordIdTaken(wordId: string, existingWords: Word[], wordsToAdd: Word[]): boolean {
  return (
    existingWords.some((word) => word.id === wordId) || wordsToAdd.some((word) => word.id === wordId)
  );
}

function resolveUniqueWordId(
  topicId: string,
  term: string,
  translation: string,
  existingWords: Word[],
  wordsToAdd: Word[],
): string | null {
  const baseId = buildWordId(topicId, term);
  if (!baseId) {
    return null;
  }

  if (!isWordIdTaken(baseId, existingWords, wordsToAdd)) {
    return baseId;
  }

  const sameAtBase =
    existingWords.find(
      (word) =>
        word.id === baseId &&
        normalizeWordText(word.term) === normalizeWordText(term) &&
        normalizeWordText(word.translation) === normalizeWordText(translation),
    ) ??
    wordsToAdd.find(
      (word) =>
        word.id === baseId &&
        normalizeWordText(word.term) === normalizeWordText(term) &&
        normalizeWordText(word.translation) === normalizeWordText(translation),
    );
  if (sameAtBase) {
    return null;
  }

  const translationSlug = slugifyWordId(translation);
  const suffix = translationSlug || "alt";
  let candidate = `${baseId}-${suffix}`;
  let counter = 2;
  while (isWordIdTaken(candidate, existingWords, wordsToAdd)) {
    candidate = `${baseId}-${suffix}-${counter}`;
    counter += 1;
  }
  return candidate;
}

export function parseWordImportPayload(raw: unknown): { entries: WordImportEntry[]; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(raw)) {
    return { entries: [], errors: ["Очікується JSON-масив"] };
  }

  const entries: WordImportEntry[] = [];
  raw.forEach((item, index) => {
    if (!item || typeof item !== "object") {
      errors.push(`Запис ${index + 1}: некоректний формат`);
      return;
    }

    const record = item as Record<string, unknown>;
    const topic = record.topic;
    const words = record.words;

    if (typeof topic !== "string" || !topic.trim()) {
      errors.push(`Запис ${index + 1}: topic обов'язковий`);
      return;
    }

    if (Array.isArray(words)) {
      if (words.length === 0) {
        errors.push(`Запис ${index + 1}: words не може бути порожнім`);
        return;
      }

      const validPairs: WordImportPair[] = [];
      for (const [wordIndex, word] of words.entries()) {
        if (!isWordPair(word)) {
          errors.push(`Запис ${index + 1}, слово ${wordIndex + 1}: потрібні pl та ua`);
          continue;
        }
        validPairs.push(word);
      }

      if (validPairs.length === 0) {
        return;
      }

      entries.push({ topic: topic.trim(), words: validPairs });
      return;
    }

    if (!isWordPair(words)) {
      errors.push(`Запис ${index + 1}: words має містити pl та ua`);
      return;
    }

    entries.push({ topic: topic.trim(), words });
  });

  return { entries, errors };
}

export function parseWordImportJson(json: string): { entries: WordImportEntry[]; errors: string[] } {
  try {
    const parsed: unknown = JSON.parse(json);
    return parseWordImportPayload(parsed);
  } catch {
    return { entries: [], errors: ["Невалідний JSON"] };
  }
}

export interface BuildImportWordsParams {
  entries: WordImportEntry[];
  existingWords: Word[];
}

export interface BuildImportWordsResult {
  wordsToAdd: Word[];
  topicNames: Record<string, string>;
  skippedDuplicates: number;
  errors: string[];
}

export function buildWordsForImport(params: BuildImportWordsParams): BuildImportWordsResult {
  const { entries, existingWords } = params;
  const errors: string[] = [];
  const topicNames: Record<string, string> = {};
  const seenKeys = new Set<string>();
  const wordsToAdd: Word[] = [];
  let skippedDuplicates = 0;

  for (const existing of existingWords) {
    seenKeys.add(wordDedupKey(existing.topicId, existing.term, existing.translation));
  }

  for (const entry of entries) {
    const topicId = slugifyTopicId(entry.topic);
    if (!topicId) {
      errors.push(`Тему "${entry.topic}" не вдалося перетворити на id`);
      continue;
    }

    const displayName = entry.topic.trim();

    for (const pair of extractWordPairs(entry.words)) {
      const term = pair.pl.trim();
      const translation = pair.ua.trim();

      if (!term || !translation) {
        errors.push(`Тема "${entry.topic}": порожнє pl або ua`);
        continue;
      }

      if (!slugifyWordId(term)) {
        errors.push(`Тема "${entry.topic}": pl "${term}" не містить придатних символів для id`);
        continue;
      }

      const dedupKey = wordDedupKey(topicId, term, translation);
      if (seenKeys.has(dedupKey)) {
        skippedDuplicates += 1;
        continue;
      }

      const wordId = resolveUniqueWordId(topicId, term, translation, existingWords, wordsToAdd);
      if (!wordId) {
        skippedDuplicates += 1;
        continue;
      }

      seenKeys.add(dedupKey);
      wordsToAdd.push({
        id: wordId,
        term,
        translation,
        topicId,
      });
      topicNames[topicId] = displayName;
    }
  }

  return {
    wordsToAdd,
    topicNames,
    skippedDuplicates,
    errors,
  };
}

export function mergeImportResult(
  added: number,
  skippedDuplicates: number,
  errors: string[],
): WordImportResult {
  return { added, skippedDuplicates, errors };
}
