import { QUEUE_SLOTS, WAVE_UNLOCK } from "../domain/constants";
import { SelectionReason } from "../domain/enums/SelectionReason";
import { SkillType } from "../domain/enums/SkillType";
import { WordState } from "../domain/enums/WordState";
import type { LearningQueueItem } from "../domain/models/LearningQueueItem";
import type { Word } from "../domain/models/Word";
import type { WordProgress } from "../domain/models/WordProgress";
import type { SessionMode } from "../domain/enums/SessionMode";
import { ExerciseSelector } from "./ExerciseSelector";
import { isDue, isNewCard, isReviewDue, overdueDays } from "./FsrsService";
import { calculateMastery, getSkillMasteries, getWeakestSkill, isCriticalWord } from "./MasteryService";
import { calculatePriorityBreakdown } from "./PriorityService";
import type { QueueCandidate } from "./queueTypes";

export interface BuildQueueParams {
  topicId: string;
  topicWords: Word[];
  allWords: Word[];
  progressByWordId: Map<string, WordProgress>;
  now: Date;
  includeCrossTopicMixed?: boolean;
  sessionMode?: SessionMode;
  queueLimit?: number;
}

function resolveQueueLimit(limit?: number): number {
  return limit ?? QUEUE_SLOTS.total;
}

function buildCandidates(
  words: Word[],
  progressByWordId: Map<string, WordProgress>,
  now: Date,
): QueueCandidate[] {
  return words.map((word) => {
    const progress = progressByWordId.get(word.id);
    if (!progress) {
      throw new Error(`Missing progress for word ${word.id}`);
    }
    const mastery = calculateMastery(getSkillMasteries(progress));
    const priority = calculatePriorityBreakdown(progress, now);
    return { word, progress, priority, mastery };
  });
}

function sortByPriorityDesc(candidates: QueueCandidate[]): QueueCandidate[] {
  return [...candidates].sort((a, b) => b.priority.score - a.priority.score);
}

function pickCriticalWeak(
  pool: QueueCandidate[],
  used: Set<string>,
  count: number,
): { candidate: QueueCandidate; reason: SelectionReason }[] {
  const picks: { candidate: QueueCandidate; reason: SelectionReason }[] = [];
  const sorted = sortByPriorityDesc(
    pool.filter(
      (c) =>
        !used.has(c.word.id) &&
        c.progress.totalAttempts > 0 &&
        (isCriticalWord(c.mastery, c.priority.display) || c.progress.state === WordState.Relearning),
    ),
  );

  for (const candidate of sorted) {
    if (picks.length >= count) {
      break;
    }
    const reason =
      candidate.progress.errorCount >= 5
        ? SelectionReason.HighErrors
        : SelectionReason.CriticalWeak;
    picks.push({ candidate, reason });
  }
  return picks;
}

function pickOverdue(
  pool: QueueCandidate[],
  used: Set<string>,
  now: Date,
): QueueCandidate | null {
  const dueCandidates = pool.filter(
    (c) => !used.has(c.word.id) && isDue(c.progress.fsrsCard, now) && overdueDays(c.progress.fsrsCard, now) >= 1,
  );
  dueCandidates.sort(
    (a, b) => overdueDays(b.progress.fsrsCard, now) - overdueDays(a.progress.fsrsCard, now),
  );
  return dueCandidates[0] ?? null;
}

function pickDue(
  pool: QueueCandidate[],
  used: Set<string>,
  count: number,
  now: Date,
  skipOverdue: boolean,
): { candidate: QueueCandidate; reason: SelectionReason }[] {
  const picks: { candidate: QueueCandidate; reason: SelectionReason }[] = [];
  const sorted = sortByPriorityDesc(
    pool.filter((c) => {
      if (used.has(c.word.id) || !isDue(c.progress.fsrsCard, now) || isNewCard(c.progress.fsrsCard)) {
        return false;
      }
      if (skipOverdue && overdueDays(c.progress.fsrsCard, now) >= 1) {
        return false;
      }
      return true;
    }),
  );

  for (const candidate of sorted) {
    if (picks.length >= count) {
      break;
    }
    picks.push({ candidate, reason: SelectionReason.FsrsDue });
  }
  return picks;
}

function pickWeakSkill(
  pool: QueueCandidate[],
  used: Set<string>,
  count: number,
): { candidate: QueueCandidate; reason: SelectionReason }[] {
  const picks: { candidate: QueueCandidate; reason: SelectionReason }[] = [];
  const skillReason: Record<SkillType, SelectionReason> = {
    [SkillType.Context]: SelectionReason.WeakContext,
    [SkillType.Production]: SelectionReason.WeakProduction,
    [SkillType.Recall]: SelectionReason.WeakRecall,
    [SkillType.Recognition]: SelectionReason.CriticalWeak,
  };

  const sorted = sortByPriorityDesc(
    pool.filter(
      (c) =>
        !used.has(c.word.id) &&
        c.progress.state !== WordState.New &&
        c.mastery >= 0.3 &&
        c.mastery < 0.7,
    ),
  );

  for (const candidate of sorted) {
    if (picks.length >= count) {
      break;
    }
    const weakest = getWeakestSkill(getSkillMasteries(candidate.progress));
    const skills = getSkillMasteries(candidate.progress);
    const weakestValue = skills[weakest.toLowerCase() as keyof typeof skills];
    if (weakestValue >= 0.7) {
      continue;
    }
    picks.push({ candidate, reason: skillReason[weakest] });
  }
  return picks;
}

function pickNewOrLearning(
  pool: QueueCandidate[],
  used: Set<string>,
  count: number,
): { candidate: QueueCandidate; reason: SelectionReason }[] {
  const picks: { candidate: QueueCandidate; reason: SelectionReason }[] = [];

  const newWords = sortByPriorityDesc(
    pool.filter((c) => !used.has(c.word.id) && c.progress.state === WordState.New),
  );
  const learningWords = sortByPriorityDesc(
    pool.filter((c) => !used.has(c.word.id) && c.progress.state === WordState.Learning),
  );

  for (const candidate of newWords) {
    if (picks.length >= count) {
      break;
    }
    picks.push({ candidate, reason: SelectionReason.NewWord });
  }

  for (const candidate of learningWords) {
    if (picks.length >= count) {
      break;
    }
    picks.push({ candidate, reason: SelectionReason.Learning });
  }

  return picks;
}

function pickMixedReview(
  pool: QueueCandidate[],
  used: Set<string>,
  count: number,
  topicId: string,
  includeCrossTopic: boolean,
): { candidate: QueueCandidate; reason: SelectionReason }[] {
  const picks: { candidate: QueueCandidate; reason: SelectionReason }[] = [];
  const sorted = [...pool]
    .filter((c) => {
      if (used.has(c.word.id) || c.progress.state === WordState.New) {
        return false;
      }
      if (includeCrossTopic) {
        return c.word.topicId !== topicId || c.mastery >= 0.65;
      }
      return c.mastery >= 0.6 && c.priority.display < 70;
    })
    .sort((a, b) => a.priority.score - b.priority.score);

  for (const candidate of sorted) {
    if (picks.length >= count) {
      break;
    }
    picks.push({ candidate, reason: SelectionReason.MixedReview });
  }
  return picks;
}

function fillRemaining(
  pool: QueueCandidate[],
  used: Set<string>,
  count: number,
): QueueCandidate[] {
  return sortByPriorityDesc(pool.filter((c) => !used.has(c.word.id))).slice(0, count);
}

function toQueueItems(
  queue: { candidate: QueueCandidate; reason: SelectionReason }[],
  exerciseSelector: ExerciseSelector,
  queueLimit: number,
): LearningQueueItem[] {
  return queue.slice(0, queueLimit).map(({ candidate, reason }) => ({
    word: candidate.word,
    exercise: exerciseSelector.select(candidate.progress),
    priority: candidate.priority.score,
    priorityDisplay: candidate.priority.display,
    mastery: candidate.mastery,
    reason,
  }));
}

function pickLearnFallback(
  pool: QueueCandidate[],
  used: Set<string>,
  now: Date,
  count: number,
): { candidate: QueueCandidate; reason: SelectionReason }[] {
  const candidates = pool.filter(
    (c) =>
      !used.has(c.word.id) &&
      c.progress.state !== WordState.New &&
      !isReviewDue(c.progress.fsrsCard, now),
  );

  const sorted = [...candidates].sort((a, b) => {
    const priorityDiff = b.priority.score - a.priority.score;
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    return a.progress.fsrsCard.due.getTime() - b.progress.fsrsCard.due.getTime();
  });

  return sorted.slice(0, count).map((candidate) => ({
    candidate,
    reason: SelectionReason.Learning,
  }));
}

function pickLearnFallbackNotLearned(
  pool: QueueCandidate[],
  used: Set<string>,
  count: number,
): { candidate: QueueCandidate; reason: SelectionReason }[] {
  return sortByPriorityDesc(
    pool.filter((c) => !used.has(c.word.id) && c.mastery < WAVE_UNLOCK.masteryThreshold),
  )
    .slice(0, count)
    .map((candidate) => ({
      candidate,
      reason: SelectionReason.Learning,
    }));
}

function buildNewSessionQueue(
  topicCandidates: QueueCandidate[],
  exerciseSelector: ExerciseSelector,
  queueLimit: number,
  now: Date,
): LearningQueueItem[] {
  const allNew =
    topicCandidates.length > 0 &&
    topicCandidates.every(
      (c) => c.progress.state === WordState.New && c.progress.totalAttempts === 0,
    );

  if (allNew) {
    return sortByPriorityDesc(topicCandidates)
      .slice(0, queueLimit)
      .map((candidate) => ({
        word: candidate.word,
        exercise: exerciseSelector.select(candidate.progress),
        priority: candidate.priority.score,
        priorityDisplay: candidate.priority.display,
        mastery: candidate.mastery,
        reason: SelectionReason.NewWord,
      }));
  }

  const used = new Set<string>();
  const queue: { candidate: QueueCandidate; reason: SelectionReason }[] = [];

  for (const pick of pickNewOrLearning(topicCandidates, used, queueLimit)) {
    queue.push(pick);
    used.add(pick.candidate.word.id);
  }

  if (queue.length < queueLimit) {
    const learningPool = topicCandidates.filter(
      (c) =>
        !used.has(c.word.id) &&
        (c.progress.state === WordState.New || c.progress.state === WordState.Learning),
    );
    for (const candidate of fillRemaining(learningPool, used, queueLimit - queue.length)) {
      queue.push({ candidate, reason: SelectionReason.Learning });
      used.add(candidate.word.id);
    }
  }

  if (queue.length === 0) {
    for (const pick of pickLearnFallback(topicCandidates, used, now, queueLimit)) {
      queue.push(pick);
      used.add(pick.candidate.word.id);
    }
  }

  if (queue.length === 0) {
    for (const pick of pickLearnFallbackNotLearned(topicCandidates, used, queueLimit)) {
      queue.push(pick);
      used.add(pick.candidate.word.id);
    }
  }

  return toQueueItems(queue, exerciseSelector, queueLimit);
}

function buildDueSessionQueue(
  topicCandidates: QueueCandidate[],
  exerciseSelector: ExerciseSelector,
  now: Date,
  queueLimit: number,
): LearningQueueItem[] {
  const dueCandidates = topicCandidates
    .filter(
      (c) => c.progress.state !== WordState.New && isReviewDue(c.progress.fsrsCard, now),
    )
    .sort((a, b) => {
      const overdueDiff =
        overdueDays(b.progress.fsrsCard, now) - overdueDays(a.progress.fsrsCard, now);
      if (overdueDiff !== 0) {
        return overdueDiff;
      }
      return b.priority.score - a.priority.score;
    });

  const queue = dueCandidates.slice(0, queueLimit).map((candidate) => ({
    candidate,
    reason:
      overdueDays(candidate.progress.fsrsCard, now) >= 1
        ? SelectionReason.Overdue
        : SelectionReason.FsrsDue,
  }));

  return toQueueItems(queue, exerciseSelector, queueLimit);
}

export class ReviewQueueBuilder {
  private readonly exerciseSelector = new ExerciseSelector();

  build(params: BuildQueueParams): LearningQueueItem[] {
    const {
      topicId,
      topicWords,
      allWords,
      progressByWordId,
      now,
      includeCrossTopicMixed = false,
      sessionMode,
      queueLimit,
    } = params;

    const limit = resolveQueueLimit(queueLimit);

    const topicCandidates = buildCandidates(topicWords, progressByWordId, now);
    const allCandidates = buildCandidates(allWords, progressByWordId, now);
    const mixedPool = includeCrossTopicMixed ? allCandidates : topicCandidates;

    if (sessionMode === "new") {
      return buildNewSessionQueue(topicCandidates, this.exerciseSelector, limit, now);
    }

    if (sessionMode === "due") {
      return buildDueSessionQueue(topicCandidates, this.exerciseSelector, now, limit);
    }

    const allNew =
      topicCandidates.length >= QUEUE_SLOTS.total &&
      topicCandidates.every(
        (c) => c.progress.state === WordState.New && c.progress.totalAttempts === 0,
      );

    if (allNew) {
      return sortByPriorityDesc(topicCandidates)
        .slice(0, limit)
        .map((candidate) => ({
          word: candidate.word,
          exercise: this.exerciseSelector.select(candidate.progress),
          priority: candidate.priority.score,
          priorityDisplay: candidate.priority.display,
          mastery: candidate.mastery,
          reason: SelectionReason.NewWord,
        }));
    }

    const used = new Set<string>();
    const queue: { candidate: QueueCandidate; reason: SelectionReason }[] = [];

    for (const pick of pickCriticalWeak(topicCandidates, used, QUEUE_SLOTS.critical)) {
      used.add(pick.candidate.word.id);
      queue.push(pick);
    }

    const overdueCandidate = pickOverdue(topicCandidates, used, now);
    if (overdueCandidate) {
      used.add(overdueCandidate.word.id);
      queue.push({ candidate: overdueCandidate, reason: SelectionReason.Overdue });
    }

    for (const pick of pickDue(topicCandidates, used, QUEUE_SLOTS.due, now, overdueCandidate !== null)) {
      used.add(pick.candidate.word.id);
      queue.push(pick);
    }

    for (const pick of pickWeakSkill(topicCandidates, used, 3)) {
      used.add(pick.candidate.word.id);
      queue.push(pick);
    }

    for (const pick of pickNewOrLearning(topicCandidates, used, QUEUE_SLOTS.newOrLearning)) {
      used.add(pick.candidate.word.id);
      queue.push(pick);
    }

    for (const pick of pickMixedReview(mixedPool, used, QUEUE_SLOTS.mixed, topicId, includeCrossTopicMixed)) {
      used.add(pick.candidate.word.id);
      queue.push(pick);
    }

    if (queue.length < limit) {
      for (const candidate of fillRemaining(topicCandidates, used, limit - queue.length)) {
        used.add(candidate.word.id);
        queue.push({ candidate, reason: SelectionReason.Learning });
      }
    }

    return queue.slice(0, limit).map(({ candidate, reason }) => ({
      word: candidate.word,
      exercise: this.exerciseSelector.select(candidate.progress),
      priority: candidate.priority.score,
      priorityDisplay: candidate.priority.display,
      mastery: candidate.mastery,
      reason,
    }));
  }
}
