import { db } from "../db/db";
import type { PartOfSpeech, Topic, Word, WordModelDTO } from "../domain/types";

export class ImportValidationError extends Error {}

export interface ImportEntry {
  topic: string;
  pl: string;
  ua: string;
  partOfSpeech?: PartOfSpeech;
}

export interface ImportAnalysis {
  newEntries: ImportEntry[];
  duplicates: Array<{ incoming: ImportEntry; existing: Word }>;
}

export type DuplicateResolution = "keep-incoming" | "keep-existing";
export interface CommitImportResult { topicsCreated: number; wordsCreated: number; wordsUpdated: number; }

type NewImportDocument = { topic: string; words: Array<{ pl: string; ua: string; partOfSpeech?: string; "частина_мови"?: string }> };

export function parseWordModelJSON(raw: string): WordModelDTO[] {
  const entries = parseImportEntries(raw);
  return entries.map(({ pl, ua, topic, partOfSpeech }) => ({ pl, uk: ua, topic, partOfSpeech }));
}

export function parseImportEntries(raw: string): ImportEntry[] {
  let value: unknown;
  try { value = JSON.parse(raw); } catch(e) { 
    
    console.log(  "Error parsing JSON:", e  );
    throw new ImportValidationError("Не вдалося розпізнати JSON. Перевірте синтаксис."); }
  return normalizeImport(value);
}

function normalizeImport(value: unknown): ImportEntry[] {
  const documents = Array.isArray(value) ? value : [value];
  if (documents.length === 0) throw new ImportValidationError("Очікується непорожній масив слів або набір { topic, words }.");

  return documents.flatMap((document, index) => {
    if (!isRecord(document)) throw new ImportValidationError(`Елемент №${index + 1} має бути об'єктом.`);
    if (Array.isArray(document.words)) return normalizeDocument(document as NewImportDocument, index);
    return [normalizeLegacyEntry(document, index)];
  });
}

function normalizeDocument(document: NewImportDocument, index: number): ImportEntry[] {
  if (typeof document.topic !== "string" || !document.topic.trim() || document.words.length === 0) {
    throw new ImportValidationError(`Набір №${index + 1} має містити непорожні topic та words.`);
  }
  return document.words.map((word, wordIndex) => normalizeEntry(word, document.topic, `${index + 1}.${wordIndex + 1}`));
}

function normalizeLegacyEntry(value: Record<string, unknown>, index: number): ImportEntry {
  return normalizeEntry(value, typeof value.topic === "string" ? value.topic : "Без теми", String(index + 1));
}

function normalizeEntry(value: Record<string, unknown>, topic: string, position: string): ImportEntry {
  const pl = value.pl;
  const ua = value.ua ?? value.uk;
  const partOfSpeech = value.partOfSpeech ?? value["частина_мови"];
  if (typeof pl !== "string" || !pl.trim() || typeof ua !== "string" || !ua.trim()) {
    throw new ImportValidationError(`Елемент №${position} має містити непорожні поля "pl" та "ua".`);
  }
  if (typeof partOfSpeech !== "undefined" && (typeof partOfSpeech !== "string" || !partOfSpeech.trim())) {
    throw new ImportValidationError(`Поле частини мови в елементі №${position} має бути непорожнім текстом.`);
  }
  return { topic: topic.trim() || "Без теми", pl: pl.trim(), ua: ua.trim(), partOfSpeech: partOfSpeech as PartOfSpeech | undefined };
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null; }
function wordKey(pl: string, ua: string): string { return `${pl.trim().toLocaleLowerCase()}::${ua.trim().toLocaleLowerCase()}`; }

export async function analyzeImport(entries: ImportEntry[]): Promise<ImportAnalysis> {
  const existingByKey = new Map((await db.words.toArray()).map((word) => [wordKey(word.foreignText, word.nativeText), word]));
  const newEntries: ImportEntry[] = [];
  const duplicates: ImportAnalysis["duplicates"] = [];
  for (const entry of entries) {
    const existing = existingByKey.get(wordKey(entry.pl, entry.ua));
    if (existing) duplicates.push({ incoming: entry, existing }); else newEntries.push(entry);
  }
  return { newEntries, duplicates };
}

export async function commitImport(analysis: ImportAnalysis, resolution: DuplicateResolution): Promise<CommitImportResult> {
  const entries = [...analysis.newEntries, ...(resolution === "keep-incoming" ? analysis.duplicates.map(({ incoming }) => incoming) : [])];
  const topics = await db.topics.toArray();
  const topicByName = new Map(topics.map((topic) => [topic.name.toLocaleLowerCase(), topic]));
  const now = new Date().toISOString();
  const newTopics: Topic[] = [];
  const additions: Word[] = [];
  const updates: Word[] = [];
  const duplicateByKey = new Map(analysis.duplicates.map((duplicate) => [wordKey(duplicate.incoming.pl, duplicate.incoming.ua), duplicate.existing]));

  for (const entry of entries) {
    const name = entry.topic;
    const topicKey = name.toLocaleLowerCase();
    let topic = topicByName.get(topicKey);
    if (!topic) {
      topic = { id: crypto.randomUUID(), name, createdAt: now };
      topicByName.set(topicKey, topic);
      newTopics.push(topic);
    }
    const existing = duplicateByKey.get(wordKey(entry.pl, entry.ua));
    if (existing) {
      const topicIds = Array.from(new Set([existing.topicId, ...(existing.topicIds ?? []), topic.id]));
      updates.push({ ...existing, topicId: topicIds[0], topicIds, partOfSpeech: entry.partOfSpeech ?? existing.partOfSpeech });
    } else {
      additions.push({ id: crypto.randomUUID(), foreignText: entry.pl, nativeText: entry.ua, topicId: topic.id, topicIds: [topic.id], partOfSpeech: entry.partOfSpeech, importance: 1,
        exerciseTypes: ["FOREIGN_TO_NATIVE", "NATIVE_TO_FOREIGN", "MULTIPLE_CHOICE", "FILL_BLANK"], createdAt: now });
    }
  }
  await db.transaction("rw", db.topics, db.words, async () => {
    if (newTopics.length) await db.topics.bulkAdd(newTopics);
    if (additions.length) await db.words.bulkAdd(additions);
    if (updates.length) await db.words.bulkPut(updates);
  });
  return { topicsCreated: newTopics.length, wordsCreated: additions.length, wordsUpdated: updates.length };
}

export interface ImportResult { topicsCreated: number; wordsCreated: number; }
export async function importWordSet(setName: string, entries: WordModelDTO[]): Promise<ImportResult> {
  const normalized = entries.map((entry) => normalizeEntry(entry as unknown as Record<string, unknown>, entry.topic || setName || "Без теми", "1"));
  const result = await commitImport(await analyzeImport(normalized), "keep-existing");
  return { topicsCreated: result.topicsCreated, wordsCreated: result.wordsCreated };
}
