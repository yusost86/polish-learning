import type { Word } from "../domain/models/Word";
import { CATALOG_WORDS, TOPIC_NAMES } from "./catalogSeed";

let cachedWords: Word[] = CATALOG_WORDS;
let cachedTopicNames: Record<string, string> = { ...TOPIC_NAMES };

export function getCachedWords(): Word[] {
  return cachedWords;
}

export function getCachedTopicNames(): Record<string, string> {
  return cachedTopicNames;
}

export function setCatalogCache(words: Word[], topicNames: Record<string, string>): void {
  cachedWords = words;
  cachedTopicNames = topicNames;
}

export function getCachedTopics(): { topicId: string; name: string; wordCount: number }[] {
  const counts = new Map<string, number>();
  for (const word of cachedWords) {
    counts.set(word.topicId, (counts.get(word.topicId) ?? 0) + 1);
  }

  const topicIds = [...new Set([...Object.keys(cachedTopicNames), ...counts.keys()])];
  return topicIds
    .map((topicId) => ({
      topicId,
      name: cachedTopicNames[topicId] ?? topicId,
      wordCount: counts.get(topicId) ?? 0,
    }))
    .filter((topic) => topic.wordCount > 0)
    .sort((a, b) => a.name.localeCompare(b.name, "uk"));
}

export function getTopicName(topicId: string): string {
  return cachedTopicNames[topicId] ?? TOPIC_NAMES[topicId] ?? topicId;
}

export function getCatalogTopics(): { topicId: string; name: string; wordCount: number }[] {
  return getCachedTopics();
}
