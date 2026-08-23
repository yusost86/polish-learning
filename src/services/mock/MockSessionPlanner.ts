import type { Word } from "../../domain/models/Word";
import type { SessionMode } from "../../domain/enums/SessionMode";
import { getMockWords, getMockWordsByTopic } from "./MockWordCatalog";

export interface PlanSessionParams {
  mode: SessionMode;
  topicId?: string;
  limit?: number;
}

function sliceWords(words: Word[], mode: SessionMode, limit: number): Word[] {
  const offset = mode === "due" ? Math.min(1, Math.max(0, words.length - limit)) : 0;
  return words.slice(offset, offset + limit);
}

export function planSession({ mode, topicId, limit = 5 }: PlanSessionParams): Word[] {
  const pool = topicId ? getMockWordsByTopic(topicId) : getMockWords();
  return sliceWords(pool, mode, limit);
}
