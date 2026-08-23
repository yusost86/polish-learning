import type { WordImportEntry, WordImportResult } from "../domain/models/WordImport";
import type { Word } from "../domain/models/Word";
import type { LearningDataRepository } from "../repositories/WordProgressRepository";
import {
  buildWordsForImport,
  mergeImportResult,
  parseWordImportJson,
  parseWordImportPayload,
} from "./WordImportService";

export async function syncCatalogCache(
  repository: LearningDataRepository,
  setCache: (words: Word[], topicNames: Record<string, string>) => void,
): Promise<void> {
  const [words, topicNames] = await Promise.all([repository.getAllWords(), repository.getTopicNames()]);
  setCache(words, topicNames);
}

export async function importWordEntries(
  repository: LearningDataRepository,
  entries: WordImportEntry[],
): Promise<WordImportResult> {
  const existingWords = await repository.getAllWords();
  const built = buildWordsForImport({ entries, existingWords });

  if (built.wordsToAdd.length > 0 || Object.keys(built.topicNames).length > 0) {
    await repository.importCatalogBatch(built.wordsToAdd, built.topicNames);
  }

  return mergeImportResult(built.wordsToAdd.length, built.skippedDuplicates, built.errors);
}

export async function importWordsJson(
  repository: LearningDataRepository,
  json: string,
): Promise<WordImportResult> {
  const parsed = parseWordImportJson(json);
  if (parsed.errors.length > 0 && parsed.entries.length === 0) {
    return mergeImportResult(0, 0, parsed.errors);
  }

  const result = await importWordEntries(repository, parsed.entries);
  return mergeImportResult(result.added, result.skippedDuplicates, [...parsed.errors, ...result.errors]);
}

export async function importWordsPayload(
  repository: LearningDataRepository,
  payload: unknown,
): Promise<WordImportResult> {
  const parsed = parseWordImportPayload(payload);
  if (parsed.errors.length > 0 && parsed.entries.length === 0) {
    return mergeImportResult(0, 0, parsed.errors);
  }

  const result = await importWordEntries(repository, parsed.entries);
  return mergeImportResult(result.added, result.skippedDuplicates, [...parsed.errors, ...result.errors]);
}
