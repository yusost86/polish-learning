import type { MenuStats } from "../domain/models/MenuStats";
import type { TopicDeleteResult } from "../domain/models/TopicDeleteResult";
import type { TopicOverview } from "../domain/models/TopicOverview";
import type { WordImportResult } from "../domain/models/WordImport";
import type { TopicListItem } from "./types/catalog";
import type {
  SessionStartParams,
  SessionStartResult,
  SubmitAnswerParams,
  SubmitAnswerResult,
} from "./types/session";

export interface LearningService {
  initialize(): Promise<void>;
  getMenuStats(): Promise<MenuStats>;
  getTopics(): Promise<TopicListItem[]>;
  getTopicOverview(topicId: string): Promise<TopicOverview>;
  importWords(json: string): Promise<WordImportResult>;
  deleteTopic(topicId: string): Promise<TopicDeleteResult>;
  startSession(params: SessionStartParams): Promise<SessionStartResult>;
  submitAnswer(params: SubmitAnswerParams): Promise<SubmitAnswerResult>;
}
