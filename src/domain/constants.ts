export const WAVE_SIZE = 10;

export const MASTERY_WEIGHTS = {
  recognition: 0.2,
  recall: 0.3,
  production: 0.3,
  context: 0.2,
} as const;

export const PRIORITY_WEIGHTS = {
  mastery: 0.35,
  errors: 0.25,
  overdue: 0.2,
  weakSkill: 0.2,
} as const;

export const WAVE_UNLOCK = {
  masteredRatio: 0.8,
  masteryThreshold: 0.65,
  maxCriticalRatio: 0.2,
} as const;

export const TOPIC_REVIEW_THRESHOLD_PCT = 90;

export const QUEUE_SLOTS = {
  critical: 2,
  due: 3,
  newOrLearning: 3,
  mixed: 2,
  total: 10,
} as const;

export const SLOW_THRESHOLD_MS = 5000;
export const EASY_CONSECUTIVE_CORRECT = 4;
export const MAX_ERROR_RISK_COUNT = 5;
export const OVERDUE_CAP_DAYS = 7;
export const SKILL_LEARNING_RATE = 0.6;
export const CRITICAL_MASTERY_THRESHOLD = 0.3;
export const CRITICAL_PRIORITY_DISPLAY = 80;

/** Mastery bands for default exercise (newEngine §19). Context before Production. */
export const EXERCISE_MASTERY_THRESHOLDS = {
  mixedRecall: 0.85,
  production: 0.7,
  context: 0.5,
  recall: 0.3,
} as const;

export const WEAK_SKILL_EXERCISE_THRESHOLD = 0.5;
