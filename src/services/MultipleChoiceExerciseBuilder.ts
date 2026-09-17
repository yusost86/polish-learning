import type { Word } from "../domain/models/Word";
import { getMockWords } from "./mock/MockWordCatalog";

export function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function uniqueDistractors(
  word: Word,
  pool: Word[],
  count: number,
  labelOf: (item: Word) => string,
): Word[] {
  const label = labelOf(word);
  const candidates = pool.filter(
    (candidate) => candidate.id !== word.id && labelOf(candidate) !== label,
  );
  const fallback = getMockWords().filter(
    (candidate) => candidate.id !== word.id && labelOf(candidate) !== label,
  );
  const merged = [...candidates];
  for (const candidate of fallback) {
    if (!merged.some((item) => item.id === candidate.id)) {
      merged.push(candidate);
    }
  }
  return shuffled(merged).slice(0, count);
}
