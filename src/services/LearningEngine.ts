import { ExerciseType } from "../domain/enums/ExerciseType";
import type { SessionMode } from "../domain/enums/SessionMode";
import { SkillType } from "../domain/enums/SkillType";
import { WordState } from "../domain/enums/WordState";
import type { AnswerInput } from "../domain/models/AnswerInput";
import type { AnswerResult } from "../domain/models/AnswerResult";
import type { LearningQueueItem } from "../domain/models/LearningQueueItem";
import type { MenuStats } from "../domain/models/MenuStats";
import type { TopicOverview, TopicWordOverview } from "../domain/models/TopicOverview";
import type { TopicDeleteResult } from "../domain/models/TopicDeleteResult";
import type { WordImportResult } from "../domain/models/WordImport";
import type { TopicProgress } from "../domain/models/TopicProgress";
import { createEmptyWordProgress, type WordProgress } from "../domain/models/WordProgress";
import { getCachedTopics, setCatalogCache } from "../data/catalogProvider";
import { QUEUE_SLOTS } from "../domain/constants";
import type { Word } from "../domain/models/Word";
import type { LearningDataRepository } from "../repositories/WordProgressRepository";
import { FsrsService } from "./FsrsService";
import {
  calculateMastery,
  determineWordState,
  getSkillMasteries,
  getSkillProgress,
  updateSkillMastery,
} from "./MasteryService";
import { calculatePriorityBreakdown } from "./PriorityService";
import { ReviewQueueBuilder } from "./ReviewQueueBuilder";
import {
  normalizeGetNextTasksInput,
  type GetNextTasksInput,
} from "./sessionQueueTypes";
import { calculateTopicProgress } from "./TopicProgressService";
import { calculateMenuStats } from "./MenuStatsService";
import { importWordsJson, syncCatalogCache } from "./catalogSync";
import { getUnlockedTopicWords } from "./WaveManager";

function exerciseToSkill(exerciseType: ExerciseType): SkillType {
  switch (exerciseType) {
    case ExerciseType.Recognition:
      return SkillType.Recognition;
    case ExerciseType.Recall:
    case ExerciseType.MixedRecall:
      return SkillType.Recall;
    case ExerciseType.Production:
      return SkillType.Production;
    case ExerciseType.Context:
      return SkillType.Context;
  }
}

export class LearningEngine {
  private readonly fsrsService = new FsrsService();
  private readonly queueBuilder = new ReviewQueueBuilder();
  private now: Date = new Date();

  constructor(private readonly repository: LearningDataRepository) {}

  setNow(now: Date): void {
    this.now = now;
  }

  async getNextTasks(studentId: string, input?: GetNextTasksInput): Promise<LearningQueueItem[]> {
    const { topicId, mode, limit } = normalizeGetNextTasksInput(input);
    const { sessionWords, sessionTopicId, isGlobal } = await this.resolveSessionWords(studentId, topicId, mode);
    const allWords = await this.repository.getAllWords();

    const progressByWordId = new Map<string, WordProgress>();
    for (const word of allWords) {
      const progress = await this.repository.getOrCreateProgress(
        studentId,
        word.id,
        this.now,
        (now) => this.fsrsService.createInitialCard(now),
      );
      progressByWordId.set(word.id, progress);
    }

    const completedTopics = await this.countCompletedTopics(studentId);
    const includeCrossTopicMixed = isGlobal || completedTopics >= 2;

    return this.queueBuilder.build({
      topicId: sessionTopicId,
      topicWords: sessionWords,
      allWords,
      progressByWordId,
      now: this.now,
      includeCrossTopicMixed,
      sessionMode: mode,
      queueLimit: limit,
    });
  }

  private async resolveSessionWords(
    studentId: string,
    topicId: string | undefined,
    mode?: SessionMode,
  ): Promise<{ sessionWords: Word[]; sessionTopicId: string; isGlobal: boolean }> {
    if (topicId) {
      const topicWords = await this.repository.getTopicWords(topicId);
      const waveCount = await this.repository.getUnlockedWaveCount(studentId, topicId);
      return {
        sessionWords: getUnlockedTopicWords(topicWords, waveCount),
        sessionTopicId: topicId,
        isGlobal: false,
      };
    }

    if (mode === "due") {
      const allWords = await this.repository.getAllWords();
      const topicIds = [...new Set(allWords.map((w) => w.topicId))];
      const unlockedWords: Word[] = [];
      for (const tid of topicIds) {
        const topicWords = allWords.filter((w) => w.topicId === tid);
        const waveCount = await this.repository.getUnlockedWaveCount(studentId, tid);
        unlockedWords.push(...getUnlockedTopicWords(topicWords, waveCount));
      }
      return {
        sessionWords: unlockedWords,
        sessionTopicId: topicIds[0] ?? "travel",
        isGlobal: true,
      };
    }

    const fallbackTopicId = getCachedTopics()[0]?.topicId ?? "travel";
    const topicWords = await this.repository.getTopicWords(fallbackTopicId);
    const waveCount = await this.repository.getUnlockedWaveCount(studentId, fallbackTopicId);
    return {
      sessionWords: getUnlockedTopicWords(topicWords, waveCount),
      sessionTopicId: fallbackTopicId,
      isGlobal: false,
    };
  }

  async submitAnswer(input: AnswerInput): Promise<AnswerResult> {
    const progress = await this.repository.getProgress(input.studentId, input.wordId);
    if (!progress) {
      throw new Error(`Progress not found for word ${input.wordId}`);
    }

    const grade = this.fsrsService.mapAnswerToGrade(
      input.correct,
      input.responseTimeMs,
      progress.consecutiveCorrect,
    );

    const skill = exerciseToSkill(input.exerciseType);
    const skillProgress = getSkillProgress(progress, skill);
    updateSkillMastery(skillProgress, input.correct);

    progress.totalAttempts += 1;
    if (input.correct) {
      progress.correctAttempts += 1;
      progress.consecutiveCorrect += 1;
      progress.consecutiveErrors = 0;
    } else {
      progress.errorCount += 1;
      progress.consecutiveErrors += 1;
      progress.consecutiveCorrect = 0;
    }

    const totalTime =
      progress.averageResponseTimeMs * (progress.totalAttempts - 1) + input.responseTimeMs;
    progress.averageResponseTimeMs = totalTime / progress.totalAttempts;
    progress.lastReviewedAt = this.now;
    progress.updatedAt = this.now;

    const mastery = calculateMastery(getSkillMasteries(progress));
    progress.state = determineWordState(progress, mastery);
    progress.fsrsCard = this.fsrsService.applyReview(progress, grade, this.now);

    await this.repository.save(progress);

    return { grade, progress, mastery, state: progress.state };
  }

  async getWordProgress(studentId: string, wordId: string): Promise<WordProgress> {
    const progress = await this.repository.getProgress(studentId, wordId);
    if (!progress) {
      throw new Error(`Progress not found for word ${wordId}`);
    }
    return progress;
  }

  async getTopicProgress(studentId: string, topicId: string): Promise<TopicProgress> {
    return calculateTopicProgress(this.repository, studentId, topicId, this.now);
  }

  async getMenuStats(studentId: string): Promise<MenuStats> {
    return calculateMenuStats(this.repository, studentId, this.now);
  }

  async importWords(json: string): Promise<WordImportResult> {
    const result = await importWordsJson(this.repository, json);
    await syncCatalogCache(this.repository, setCatalogCache);
    return result;
  }

  async deleteTopic(studentId: string, topicId: string): Promise<TopicDeleteResult> {
    const result = await this.repository.deleteTopic(topicId, studentId);
    await syncCatalogCache(this.repository, setCatalogCache);
    return result;
  }

  async getTopicOverview(studentId: string, topicId: string): Promise<TopicOverview> {
    const topicWords = await this.repository.getTopicWords(topicId);
    const waveCount = await this.repository.getUnlockedWaveCount(studentId, topicId);
    const unlockedWords = getUnlockedTopicWords(topicWords, waveCount);
    const unlockedWordIds = new Set(unlockedWords.map((word) => word.id));
    const previewLimit = unlockedWords.length;
    const allTasks = await this.getNextTasks(studentId, { topicId, limit: previewLimit });
    const topicProgress = await this.getTopicProgress(studentId, topicId);

    const words: TopicWordOverview[] = [];
    for (const word of topicWords) {
      const isLocked = !unlockedWordIds.has(word.id);

      if (isLocked) {
        const progress = await this.repository.getProgress(studentId, word.id);
        words.push({
          wordId: word.id,
          term: word.term,
          translation: word.translation,
          state: progress?.state ?? WordState.New,
          mastery: progress ? calculateMastery(getSkillMasteries(progress)) : 0,
          priorityDisplay: progress ? calculatePriorityBreakdown(progress, this.now).display : 0,
          fsrsStatus: progress ? this.fsrsService.formatStatus(progress.fsrsCard, this.now) : "—",
          errorCount: progress?.errorCount ?? 0,
          totalAttempts: progress?.totalAttempts ?? 0,
          isLocked: true,
          skills: progress
            ? getSkillMasteries(progress)
            : { recognition: 0, recall: 0, production: 0, context: 0 },
        });
        continue;
      }

      const progress = await this.repository.getOrCreateProgress(
        studentId,
        word.id,
        this.now,
        (now) => this.fsrsService.createInitialCard(now),
      );
      const skills = getSkillMasteries(progress);
      const mastery = calculateMastery(skills);
      const priority = calculatePriorityBreakdown(progress, this.now);

      words.push({
        wordId: word.id,
        term: word.term,
        translation: word.translation,
        state: progress.state,
        mastery,
        priorityDisplay: priority.display,
        fsrsStatus: this.fsrsService.formatStatus(progress.fsrsCard, this.now),
        errorCount: progress.errorCount,
        totalAttempts: progress.totalAttempts,
        isLocked: false,
        skills,
      });
    }

    words.sort((a, b) => {
      if (a.isLocked !== b.isLocked) {
        return a.isLocked ? 1 : -1;
      }
      if (!a.isLocked && !b.isLocked) {
        return b.priorityDisplay - a.priorityDisplay || a.term.localeCompare(b.term);
      }
      return a.term.localeCompare(b.term);
    });

    return {
      topicId,
      topicProgress,
      upcomingTasks: allTasks.slice(0, QUEUE_SLOTS.total),
      followingTasks: allTasks.slice(QUEUE_SLOTS.total),
      words,
    };
  }

  async resetWord(studentId: string, wordId: string): Promise<void> {
    const fresh = createEmptyWordProgress(
      studentId,
      wordId,
      this.now,
      this.fsrsService.createInitialCard(this.now),
    );
    await this.repository.save(fresh);
  }

  private async countCompletedTopics(studentId: string): Promise<number> {
    const allWords = await this.repository.getAllWords();
    const topicIds = [...new Set(allWords.map((w) => w.topicId))];
    let completed = 0;
    for (const topicId of topicIds) {
      const topicProgress = await calculateTopicProgress(this.repository, studentId, topicId, this.now);
      if (topicProgress.canOpenNextWave) {
        completed += 1;
      }
    }
    return completed;
  }
}
