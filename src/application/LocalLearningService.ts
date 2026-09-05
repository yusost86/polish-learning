import { DEFAULT_STUDENT_ID } from "../data/catalogSeed";
import { TOPIC_NAMES } from "../data/catalogSeed";
import type { LearningQueueItem } from "../domain/models/LearningQueueItem";
import type { MenuStats } from "../domain/models/MenuStats";
import type { TopicDeleteResult } from "../domain/models/TopicDeleteResult";
import type { TopicOverview } from "../domain/models/TopicOverview";
import type { Word } from "../domain/models/Word";
import type { WordImportResult } from "../domain/models/WordImport";
import type { SessionMode } from "../domain/enums/SessionMode";
import type { ExerciseTask } from "../domain/models/ExerciseTask";
import { DexieLearningRepository } from "../repositories/DexieLearningRepository";
import type { LearningDataRepository } from "../repositories/WordProgressRepository";
import { syncCatalogCache } from "../services/catalogSync";
import { buildTaskFromQueueItem } from "../services/exerciseTaskBuilder";
import { LearningEngine } from "../services/LearningEngine";
import { sessionModeLabel } from "../utils/sessionUtils";
import { gradeSessionAnswer } from "./answerGrading";
import type { LearningService } from "./LearningService";
import type { TopicListItem } from "./types/catalog";
import type {
  SessionStartParams,
  SessionStartResult,
  SubmitAnswerParams,
  SubmitAnswerResult,
} from "./types/session";

interface SessionState {
  mode: SessionMode;
  topicId?: string;
  topicName: string;
  modeLabel: string;
  queue: LearningQueueItem[];
  tasks: ExerciseTask[];
  answeredTasks: Map<number, SubmitAnswerResult>;
}

function createSessionId(): string {
  return crypto.randomUUID();
}

export class LocalLearningService implements LearningService {
  private engine: LearningEngine | null = null;
  private repository: LearningDataRepository | null = null;
  private wordPool: Word[] = [];
  private topicNames: Record<string, string> = { ...TOPIC_NAMES };
  private readonly sessions = new Map<string, SessionState>();

  constructor(
    private readonly deps?: {
      repository?: LearningDataRepository;
      engine?: LearningEngine;
    },
  ) {}

  async initialize(): Promise<void> {
    if (this.engine) {
      return;
    }

    const repository = this.deps?.repository ?? new DexieLearningRepository();
    if (repository instanceof DexieLearningRepository) {
      await repository.initialize();
    }

    this.repository = repository;
    this.engine = this.deps?.engine ?? new LearningEngine(repository);
    await this.refreshCatalog();
  }

  async initializeForTests(repository?: LearningDataRepository): Promise<void> {
    this.engine = null;
    this.repository = null;
    this.sessions.clear();

    const repo = repository ?? new DexieLearningRepository();
    if (repo instanceof DexieLearningRepository) {
      await repo.initialize();
    }
    this.repository = repo;
    this.engine = new LearningEngine(repo);
    await this.refreshCatalog();
  }

  private getEngine(): LearningEngine {
    if (!this.engine) {
      throw new Error("LearningService not initialized");
    }
    return this.engine;
  }

  private getRepository(): LearningDataRepository {
    if (!this.repository) {
      throw new Error("LearningService not initialized");
    }
    return this.repository;
  }

  private async refreshCatalog(): Promise<void> {
    await syncCatalogCache(this.getRepository(), (words, topicNames) => {
      this.wordPool = words;
      this.topicNames = topicNames;
    });
  }

  private resolveTopicName(topicId: string): string {
    return this.topicNames[topicId] ?? TOPIC_NAMES[topicId] ?? topicId;
  }

  private enrichMenuStats(stats: MenuStats): MenuStats {
    return {
      ...stats,
      topics: stats.topics.map((topic) => ({
        ...topic,
        name: this.resolveTopicName(topic.topicId),
      })),
    };
  }

  async getMenuStats(): Promise<MenuStats> {
    const stats = await this.getEngine().getMenuStats(DEFAULT_STUDENT_ID);
    return this.enrichMenuStats(stats);
  }

  async getTopics(): Promise<TopicListItem[]> {
    const words = await this.getRepository().getAllWords();
    const counts = new Map<string, number>();
    for (const word of words) {
      counts.set(word.topicId, (counts.get(word.topicId) ?? 0) + 1);
    }

    const topicIds = [...new Set([...Object.keys(this.topicNames), ...counts.keys()])];
    return topicIds
      .map((topicId) => ({
        topicId,
        name: this.resolveTopicName(topicId),
        wordCount: counts.get(topicId) ?? 0,
      }))
      .filter((topic) => topic.wordCount > 0)
      .sort((a, b) => a.name.localeCompare(b.name, "uk"));
  }

  async getTopicOverview(topicId: string): Promise<TopicOverview> {
    const overview = await this.getEngine().getTopicOverview(DEFAULT_STUDENT_ID, topicId);
    return {
      ...overview,
      topicName: this.resolveTopicName(topicId),
    };
  }

  async importWords(json: string): Promise<WordImportResult> {
    const result = await this.getEngine().importWords(json);
    await this.refreshCatalog();
    return result;
  }

  async deleteTopic(topicId: string): Promise<TopicDeleteResult> {
    const result = await this.getEngine().deleteTopic(DEFAULT_STUDENT_ID, topicId);
    await this.refreshCatalog();
    return result;
  }

  async startSession(params: SessionStartParams): Promise<SessionStartResult> {
    const queue = await this.getEngine().getNextTasks(DEFAULT_STUDENT_ID, {
      topicId: params.topicId,
      mode: params.mode,
    });

    const tasks = queue.map((item) => buildTaskFromQueueItem(item, this.wordPool));
    const sessionId = createSessionId();
    const topicName = params.topicId ? this.resolveTopicName(params.topicId) : "";

    this.sessions.set(sessionId, {
      mode: params.mode,
      topicId: params.topicId,
      topicName,
      modeLabel: sessionModeLabel(params.mode),
      queue,
      tasks,
      answeredTasks: new Map(),
    });

    return {
      sessionId,
      tasks,
      topicName,
      modeLabel: sessionModeLabel(params.mode),
    };
  }

  async submitAnswer(params: SubmitAnswerParams): Promise<SubmitAnswerResult> {
    const session = this.sessions.get(params.sessionId);
    if (!session) {
      throw new Error(`Session not found: ${params.sessionId}`);
    }

    const existing = session.answeredTasks.get(params.taskIndex);
    if (existing) {
      return existing;
    }

    const queueItem = session.queue[params.taskIndex];
    const task = session.tasks[params.taskIndex];
    if (!queueItem || !task) {
      throw new Error(`Task not found at index ${params.taskIndex}`);
    }

    const graded = gradeSessionAnswer(task, params.answer);

    await this.getEngine().submitAnswer({
      studentId: DEFAULT_STUDENT_ID,
      wordId: queueItem.word.id,
      exerciseType: queueItem.exercise,
      correct: graded.isCorrect,
      responseTimeMs: params.responseTimeMs,
    });

    const nextTaskIndex = params.taskIndex + 1;
    const result: SubmitAnswerResult = {
      isCorrect: graded.isCorrect,
      correctAnswerLabel: graded.correctAnswerLabel,
      isSessionComplete: nextTaskIndex >= session.tasks.length,
      nextTaskIndex,
    };

    session.answeredTasks.set(params.taskIndex, result);
    return result;
  }

  endSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}
