import type { MenuStats } from "../domain/models/MenuStats";
import type { TopicDeleteResult } from "../domain/models/TopicDeleteResult";
import type { TopicOverview } from "../domain/models/TopicOverview";
import type { WordImportResult } from "../domain/models/WordImport";
import type { LearningService } from "./LearningService";
import type { TopicListItem } from "./types/catalog";
import type {
  SessionStartParams,
  SessionStartResult,
  SubmitAnswerParams,
  SubmitAnswerResult,
} from "./types/session";

export class MockLearningService implements LearningService {
  initialize = async (): Promise<void> => {};

  getMenuStats = async (): Promise<MenuStats> => ({
    totalUniqueWords: 0,
    newWordsCount: 0,
    learnedWordsCount: 0,
    dueNowCount: 0,
    topics: [],
  });

  getTopics = async (): Promise<TopicListItem[]> => [];

  getTopicOverview = async (topicId: string): Promise<TopicOverview> => {
    throw new Error(`MockLearningService: getTopicOverview(${topicId}) not configured`);
  };

  importWords = async (): Promise<WordImportResult> => ({
    added: 0,
    skippedDuplicates: 0,
    errors: [],
  });

  deleteTopic = async (): Promise<TopicDeleteResult> => ({
    topicId: "",
    deletedWordCount: 0,
  });

  startSession = async (_params: SessionStartParams): Promise<SessionStartResult> => ({
    sessionId: "mock-session",
    tasks: [],
    topicName: "",
    modeLabel: "",
  });

  submitAnswer = async (params: SubmitAnswerParams): Promise<SubmitAnswerResult> => ({
    isCorrect: true,
    correctAnswerLabel: "",
    isSessionComplete: params.taskIndex >= 0,
    nextTaskIndex: params.taskIndex + 1,
  });
}
