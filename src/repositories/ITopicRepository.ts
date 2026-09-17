import type { TopicDeleteResult } from "../domain/models/TopicDeleteResult";
import type { Word } from "../domain/models/Word";

export interface ITopicRepository {
  getTopicNames(): Promise<Record<string, string>>;
  getAllWords(): Promise<Word[]>;
  addWords(words: Word[]): Promise<number>;
  saveTopicNames(topicNames: Record<string, string>): Promise<void>;
  importCatalogBatch(words: Word[], topicNames: Record<string, string>): Promise<number>;
  deleteTopic(topicId: string, studentId: string): Promise<TopicDeleteResult>;
}
