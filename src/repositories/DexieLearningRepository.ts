import { db } from "../db/database";
import { ensureTopicsSeeded, repairCatalogIfNeeded, seedCatalogIfEmpty } from "../db/seedCatalog";
import type { Word } from "../domain/models/Word";
import type { TopicDeleteResult } from "../domain/models/TopicDeleteResult";
import {
  createEmptyLearningWord,
  type LearningWord,
} from "../domain/models/LearningWordModel";
import type { ILearningWordRepository } from "./ILearningWordRepository";
import type { ITopicRepository } from "./ITopicRepository";
import {
  deserializeLearningWord,
  learningWordStorageId,
  serializeLearningWord,
} from "./progressMapper";

type StoredLanguage = "ukrainian" | "polish" | "english ";

const POLISH: StoredLanguage = "polish";
const UKRAINIAN: StoredLanguage = "ukrainian";

export class DexieLearningRepository implements ILearningWordRepository, ITopicRepository {
  async initialize(): Promise<void> {
    await seedCatalogIfEmpty();
    await ensureTopicsSeeded();
    await repairCatalogIfNeeded();
  }

  async getLearningWordsByTopic(topicId: string): Promise<LearningWord[]> {
    const topic = await db.topics.get(topicId);
    if (!topic) {
      return [];
    }
    return topic.wordProgress.map(deserializeLearningWord);
  }

  async getLearningWords(): Promise<LearningWord[]> {
    const topics = await db.topics.toArray();
    return topics.flatMap((topic) => topic.wordProgress.map(deserializeLearningWord));
  }

  async save(learningWord: LearningWord): Promise<void> {
    const topic = await db.topics.get(learningWord.topicId);
    if (!topic) {
      throw new Error(`Topic "${learningWord.topicId}" not found`);
    }

    const stored = serializeLearningWord({
      ...learningWord,
      updatedAt: new Date(),
    });
    const index = topic.wordProgress.findIndex((entry) => entry.wordId === learningWord.wordId);
    const wordProgress = [...topic.wordProgress];
    if (index >= 0) {
      wordProgress[index] = stored;
    } else {
      wordProgress.push(stored);
    }

    await db.topics.put({ ...topic, wordProgress });
  }

  async getTopicNames(): Promise<Record<string, string>> {
    const topics = await db.topics.toArray();
    const names: Record<string, string> = {};
    for (const topic of topics) {
      names[topic.id] = topic.name;
    }
    return names;
  }

  async getAllWords(): Promise<Word[]> {
    const [topics, storedWords] = await Promise.all([db.topics.toArray(), db.words.toArray()]);
    const wordsById = new Map(storedWords.map((word) => [word.id, word]));
    const result: Word[] = [];

    for (const topic of topics) {
      for (const progress of topic.wordProgress) {
        const polishWord = wordsById.get(progress.wordId);
        if (!polishWord || polishWord.language !== POLISH) {
          continue;
        }

        const translationLink = polishWord.translation.find((entry) => entry.language === UKRAINIAN);
        const translationWord = translationLink ? wordsById.get(translationLink.wordId) : undefined;

        result.push({
          id: polishWord.id,
          term: polishWord.term,
          translation: translationWord?.term ?? "",
          topicId: topic.id,
        });
      }
    }

    return result;
  }

  async addWords(words: Word[]): Promise<number> {
    if (words.length === 0) {
      return 0;
    }

    const now = new Date().toISOString();
    await db.transaction("rw", [db.words, db.topics], async () => {
      for (const word of words) {
        await this.putWordPair(word);
        await this.ensureTopicProgress(word, now);
      }
    });

    return words.length;
  }

  async saveTopicNames(topicNames: Record<string, string>): Promise<void> {
    const existingTopics = await db.topics.toArray();
    const byId = new Map(existingTopics.map((topic) => [topic.id, topic]));

    await db.topics.bulkPut(
      Object.entries(topicNames).map(([id, name]) => {
        const existing = byId.get(id);
        return existing
          ? { ...existing, name }
          : { id, name, language: POLISH, wordProgress: [] };
      }),
    );
  }

  async importCatalogBatch(words: Word[], topicNames: Record<string, string>): Promise<number> {
    if (words.length === 0 && Object.keys(topicNames).length === 0) {
      return 0;
    }

    await db.transaction("rw", [db.words, db.topics], async () => {
      if (Object.keys(topicNames).length > 0) {
        await this.saveTopicNames(topicNames);
      }
      if (words.length > 0) {
        await this.addWords(words);
      }
    });

    return words.length;
  }

  async deleteTopic(topicId: string, _studentId: string): Promise<TopicDeleteResult> {
    const topic = await db.topics.get(topicId);
    if (!topic) {
      throw new Error(`Topic "${topicId}" not found`);
    }

    const words = await this.getAllWords();
    const deletedWordCount = words.filter((word) => word.topicId === topicId).length;
    const wordIds = new Set(
      topic.wordProgress.map((entry) => entry.wordId),
    );

    await db.transaction("rw", [db.words, db.topics], async () => {
      await db.topics.delete(topicId);

      for (const wordId of wordIds) {
        const ukId = `${wordId}-uk`;
        await db.words.delete(wordId);
        await db.words.delete(ukId);
      }
    });

    return { topicId, deletedWordCount };
  }

  private async putWordPair(word: Word): Promise<void> {
    const ukId = `${word.id}-uk`;
    await db.words.put({
      id: word.id,
      term: word.term,
      partOfSpeech: "noun",
      language: POLISH,
      translation: [{ language: UKRAINIAN, wordId: ukId }],
    });
    await db.words.put({
      id: ukId,
      term: word.translation,
      partOfSpeech: "noun",
      language: UKRAINIAN,
      translation: [{ language: POLISH, wordId: word.id }],
    });
  }

  private async ensureTopicProgress(word: Word, now: string): Promise<void> {
    const topic = await db.topics.get(word.topicId);
    const progressEntry = serializeLearningWord(createEmptyLearningWord(word.id, word.topicId, new Date(now)));

    if (!topic) {
      await db.topics.put({
        id: word.topicId,
        name: word.topicId,
        language: POLISH,
        wordProgress: [progressEntry],
      });
      return;
    }

    const exists = topic.wordProgress.some((entry) => entry.wordId === word.id);
    if (exists) {
      return;
    }

    await db.topics.put({
      ...topic,
      wordProgress: [...topic.wordProgress, progressEntry],
    });
  }

  async getOrCreateLearningWord(wordId: string, topicId: string, now: Date): Promise<LearningWord> {
    const topic = await db.topics.get(topicId);
    const existing = topic?.wordProgress.find((entry) => entry.wordId === wordId);
    if (existing) {
      return deserializeLearningWord(existing);
    }

    const created = createEmptyLearningWord(wordId, topicId, now);
    await this.save(created);
    return created;
  }
}

export function getLearningWordId(topicId: string, wordId: string): string {
  return learningWordStorageId(topicId, wordId);
}
