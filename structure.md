Структура
src/
├── features/
│   └── learning/
│       ├── types.ts
│       ├── constants.ts
│       │
│       ├── fsrs/
│       │   ├── fsrsAdapter.ts
│       │   └── fsrsScheduler.ts
│       │
│       ├── mastery/
│       │   ├── masteryCalculator.ts
│       │   └── masteryEngine.ts
│       │
│       ├── exercises/
│       │   ├── exerciseSelector.ts
│       │   └── exerciseScoring.ts
│       │
│       ├── topic/
│       │   └── topicEngine.ts
│       │
│       ├── queue/
│       │   └── reviewQueue.ts
│       │
│       └── learningEngine.ts
1. types.ts
Це центральні типи всієї системи.
// src/features/learning/types.ts

import type { Card } from 'ts-fsrs'

/**
 * Структура словникового запасу:
 *
 * Topic
 *   └── Subtopic
 *          └── Word
 */
export interface Topic {
  id: string
  name: string

  /**
   * Загальний порядок теми в курсі.
   */
  order: number

  /**
   * Скільки нових слів дозволено відкривати
   * за один навчальний цикл.
   */
  newWordsPerCycle: number
}

export interface Subtopic {
  id: string
  topicId: string
  name: string
  order: number
}

/**
 * Базове слово словника.
 */
export interface Word {
  id: string

  term: string
  translation: string

  topicId: string
  subtopicId?: string

  /**
   * Пріоритет слова в курсі.
   * Можна використовувати для vocabulary curriculum.
   */
  priority?: number
}

/**
 * Поточний стан слова для конкретного учня.
 */
export type WordState =
  | 'new'
  | 'introduced'
  | 'learning'
  | 'consolidating'
  | 'mature'

/**
 * Навички, які ми оцінюємо окремо.
 */
export interface SkillScores {
  recognition: number
  recall: number
  production: number
  context: number
}

/**
 * Типи вправ.
 */
export type ExerciseType =
  | 'recognition'
  | 'recall'
  | 'production'
  | 'context'

/**
 * Конкретні варіанти вправ.
 */
export type ExerciseVariant =
  | 'multiple-choice'
  | 'reverse-multiple-choice'
  | 'typing'
  | 'sentence-completion'
  | 'translation'
  | 'mixed-recall'

/**
 * FSRS grade.
 *
 * ВАЖЛИВО:
 * ts-fsrs використовує Grade, а не Rating.
 */
export type FsrsGrade =
  | 'again'
  | 'hard'
  | 'good'
  | 'easy'

/**
 * Статистика слова для конкретного учня.
 */
export interface WordLearningStats {

  wordId: string
  studentId: string

  topicId: string
  subtopicId?: string

  state: WordState

  /**
   * Окремий прогрес кожної навички.
   */
  skills: SkillScores

  /**
   * Загальний Mastery.
   */
  mastery: number

  /**
   * Яка навичка зараз найслабша.
   */
  weakestSkill: ExerciseType

  /**
   * Кількість відповідей.
   */
  attempts: number

  correctAnswers: number
  wrongAnswers: number

  /**
   * Послідовні правильні відповіді.
   */
  correctStreak: number

  /**
   * Середній час відповіді.
   */
  averageResponseTimeMs: number

  /**
   * Останній тип вправи.
   */
  lastExerciseType?: ExerciseType

  /**
   * Останній результат.
   */
  lastCorrect?: boolean

  /**
   * FSRS card.
   */
  fsrsCard: Card

  /**
   * Дата останньої взаємодії.
   */
  lastReviewedAt?: Date

  /**
   * Коли слово потрібно показати.
   *
   * Цю дату визначає FSRS.
   */
  nextReviewAt?: Date

  createdAt: Date
  updatedAt: Date
}

/**
 * Запис про результат однієї спроби.
 *
 * Рекомендується зберігати окремо від WordLearningStats.
 */
export interface ReviewLog {

  id: string

  studentId: string
  wordId: string

  topicId: string

  exerciseType: ExerciseType
  exerciseVariant: ExerciseVariant

  correct: boolean

  responseTimeMs: number

  fsrsGrade: FsrsGrade

  createdAt: Date
}

/**
 * Стан теми.
 */
export interface TopicProgress {

  topicId: string

  totalWords: number

  newWords: number
  introducedWords: number
  learningWords: number
  consolidatingWords: number
  matureWords: number

  averageMastery: number

  completed: boolean
}

/**
 * Результат вибору наступної вправи.
 */
export interface ExerciseSelection {

  word: Word

  type: ExerciseType

  variant: ExerciseVariant

  reason: string

  priority: number
}

/**
 * Контекст поточної навчальної сесії.
 */
export interface LearningSession {

  studentId: string

  topicId?: string

  /**
   * Максимальна кількість нових слів
   * за один цикл.
   */
  newWordsLimit: number

  /**
   * Скільки слів можна показати
   * за одну сесію.
   */
  sessionLimit: number
}
2. constants.ts
// src/features/learning/constants.ts

import type { ExerciseType, WordState } from './types'

/**
 * Пороги для Mastery.
 */
export const MASTERY_THRESHOLDS = {

  /**
   * Мінімальний рівень після знайомства.
   */
  INTRODUCED: 0.15,

  /**
   * Слово вже реально вивчається.
   */
  LEARNING: 0.40,

  /**
   * Основні навички вже сформовані.
   */
  CONSOLIDATING: 0.65,

  /**
   * Слово добре засвоєне.
   */
  MATURE: 0.85,

} as const

/**
 * Максимальний внесок кожної навички.
 */
export const SKILL_WEIGHTS: Record<ExerciseType, number> = {

  recognition: 0.20,

  recall: 0.30,

  production: 0.30,

  context: 0.20,

}

/**
 * Порогові значення для вибору вправ.
 */
export const EXERCISE_THRESHOLDS = {

  recognition: 0.75,

  recall: 0.70,

  production: 0.70,

  context: 0.65,

} as const

/**
 * Максимальна кількість повторень
 * одного слова в рамках поточного циклу.
 */
export const MAX_LEARNING_ATTEMPTS = 5
3. masteryCalculator.ts
Це основна логіка оцінки знання слова.
// src/features/learning/mastery/masteryCalculator.ts

import {
  MASTERY_THRESHOLDS,
  SKILL_WEIGHTS,
} from '../constants'

import type {
  ExerciseType,
  SkillScores,
  WordState,
} from '../types'

/**
 * Обмежує число в діапазоні 0..1.
 */
export function clamp(
  value: number,
  min = 0,
  max = 1,
): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Визначає загальний Mastery.
 *
 * Mastery = weighted average skills.
 */
export function calculateMastery(
  skills: SkillScores,
): number {

  return (
    skills.recognition * SKILL_WEIGHTS.recognition +
    skills.recall * SKILL_WEIGHTS.recall +
    skills.production * SKILL_WEIGHTS.production +
    skills.context * SKILL_WEIGHTS.context
  )
}

/**
 * Визначає найслабшу навичку.
 *
 * Саме вона визначає наступну вправу.
 */
export function getWeakestSkill(
  skills: SkillScores,
): ExerciseType {

  const entries = Object.entries(skills) as [
    ExerciseType,
    number
  ][]

  entries.sort((a, b) => a[1] - b[1])

  return entries[0][0]
}

/**
 * Оновлює конкретну навичку
 * після виконання вправи.
 *
 * Використовується EMA:
 *
 * new = old * 0.7 + result * 0.3
 */
export function updateSkillScore(
  current: number,
  correct: boolean,
  responseTimeMs: number,
): number {

  const result = correct ? 1 : 0

  /**
   * Штраф за дуже повільну відповідь.
   *
   * Не робимо його агресивним.
   */
  const speedPenalty =
    responseTimeMs > 10000
      ? 0.10
      : responseTimeMs > 6000
        ? 0.05
        : 0

  const adjustedResult = Math.max(
    0,
    result - speedPenalty,
  )

  return clamp(
    current * 0.7 +
    adjustedResult * 0.3,
  )
}

/**
 * Визначає поточний state слова.
 */
export function determineWordState(
  mastery: number,
  attempts: number,
): WordState {

  if (attempts === 0) {
    return 'new'
  }

  if (mastery < MASTERY_THRESHOLDS.INTRODUCED) {
    return 'introduced'
  }

  if (mastery < MASTERY_THRESHOLDS.LEARNING) {
    return 'learning'
  }

  if (mastery < MASTERY_THRESHOLDS.CONSOLIDATING) {
    return 'consolidating'
  }

  return 'mature'
}
4. masteryEngine.ts
Цей файл об'єднує всю логіку після відповіді.
// src/features/learning/mastery/masteryEngine.ts

import {
  calculateMastery,
  determineWordState,
  getWeakestSkill,
  updateSkillScore,
} from './masteryCalculator'

import type {
  ExerciseType,
  WordLearningStats,
} from '../types'

export interface ApplyAnswerInput {

  exerciseType: ExerciseType

  correct: boolean

  responseTimeMs: number
}

/**
 * Застосовує результат відповіді
 * до статистики слова.
 *
 * ВАЖЛИВО:
 *
 * Цей метод не змінює FSRS Card.
 * FSRS оновлюється окремо.
 */
export function applyAnswerToMastery(
  stats: WordLearningStats,
  input: ApplyAnswerInput,
): WordLearningStats {

  const skills = {
    ...stats.skills,
  }

  /**
   * Оновлюємо тільки ту навичку,
   * яку реально перевіряли.
   */
  skills[input.exerciseType] =
    updateSkillScore(
      skills[input.exerciseType],
      input.correct,
      input.responseTimeMs,
    )

  const attempts =
    stats.attempts + 1

  const correctAnswers =
    stats.correctAnswers +
    (input.correct ? 1 : 0)

  const wrongAnswers =
    stats.wrongAnswers +
    (input.correct ? 0 : 1)

  const correctStreak =
    input.correct
      ? stats.correctStreak + 1
      : 0

  const mastery =
    calculateMastery(skills)

  const state =
    determineWordState(
      mastery,
      attempts,
    )

  return {
    ...stats,

    skills,

    mastery,

    weakestSkill:
      getWeakestSkill(skills),

    attempts,

    correctAnswers,

    wrongAnswers,

    correctStreak,

    averageResponseTimeMs:
      (
        stats.averageResponseTimeMs *
        stats.attempts +
        input.responseTimeMs
      ) / attempts,

    lastExerciseType:
      input.exerciseType,

    lastCorrect:
      input.correct,

    state,

    lastReviewedAt:
      new Date(),

    updatedAt:
      new Date(),
  }
}
5. exerciseSelector.ts
Ось тут знаходиться логіка:
Що саме показати учню?

// src/features/learning/exercises/exerciseSelector.ts

import type {
  ExerciseSelection,
  ExerciseType,
  ExerciseVariant,
  Word,
  WordLearningStats,
} from '../types'

/**
 * Вибирає тип вправи
 * відповідно до найслабшої навички.
 */
export function selectExerciseType(
  stats: WordLearningStats,
): ExerciseType {

  /**
   * Нове слово.
   */
  if (stats.attempts === 0) {
    return 'recognition'
  }

  /**
   * Якщо Recognition слабкий.
   */
  if (stats.skills.recognition < 0.75) {
    return 'recognition'
  }

  /**
   * Якщо Recall слабкий.
   */
  if (stats.skills.recall < 0.70) {
    return 'recall'
  }

  /**
   * Якщо Production слабкий.
   */
  if (stats.skills.production < 0.70) {
    return 'production'
  }

  /**
   * Якщо Context слабкий.
   */
  if (stats.skills.context < 0.65) {
    return 'context'
  }

  /**
   * Якщо все добре —
   * змішана перевірка.
   */
  return 'recall'
}

/**
 * Вибирає конкретний формат вправи.
 */
export function selectExerciseVariant(
  type: ExerciseType,
): ExerciseVariant {

  switch (type) {

    case 'recognition':
      return 'multiple-choice'

    case 'recall':
      return 'reverse-multiple-choice'

    case 'production':
      return 'typing'

    case 'context':
      return 'sentence-completion'

    default:
      return 'mixed-recall'
  }
}

/**
 * Вибирає наступну вправу.
 */
export function selectExercise(
  word: Word,
  stats: WordLearningStats,
): ExerciseSelection {

  const type =
    selectExerciseType(stats)

  const variant =
    selectExerciseVariant(type)

  return {

    word,

    type,

    variant,

    reason:
      `Weakest skill: ${stats.weakestSkill}`,

    priority:
      calculateExercisePriority(stats),
  }
}

/**
 * Чим менший Mastery —
 * тим більший пріоритет.
 */
function calculateExercisePriority(
  stats: WordLearningStats,
): number {

  const masteryPriority =
    1 - stats.mastery

  const errorPriority =
    Math.min(
      stats.wrongAnswers / 5,
      1,
    )

  const duePriority =
    stats.nextReviewAt &&
    stats.nextReviewAt.getTime() <= Date.now()
      ? 1
      : 0

  return (
    masteryPriority * 0.5 +
    errorPriority * 0.3 +
    duePriority * 0.2
  )
}
6. fsrsAdapter.ts
Тут ізолюємо ts-fsrs.
Це дуже важливо: якщо завтра захочеш змінити FSRS або бібліотеку, тобі не доведеться переписувати всю систему.
// src/features/learning/fsrs/fsrsAdapter.ts

import {
  createEmptyCard,
  FSRS,
  Rating,
  State,
  type Card,
} from 'ts-fsrs'

import type {
  FsrsGrade,
} from '../types'

/**
 * Створює нову FSRS Card.
 */
export function createNewFsrsCard(): Card {
  return createEmptyCard()
}

/**
 * Конвертує наш Grade
 * у Rating ts-fsrs.
 */
export function toFsrsRating(
  grade: FsrsGrade,
): Rating {

  switch (grade) {

    case 'again':
      return Rating.Again

    case 'hard':
      return Rating.Hard

    case 'good':
      return Rating.Good

    case 'easy':
      return Rating.Easy
  }
}

/**
 * Визначає Grade на основі
 * результату Multiple Choice.
 *
 * Це не є "офіційним" FSRS Grade.
 *
 * Це наш адаптер:
 *
 * incorrect → Again
 *
 * correct + slow → Hard
 *
 * correct + normal → Good
 *
 * correct + fast + streak → Easy
 */
export function gradeMultipleChoice(
  correct: boolean,
  responseTimeMs: number,
  correctStreak: number,
): FsrsGrade {

  if (!correct) {
    return 'again'
  }

  if (responseTimeMs > 7000) {
    return 'hard'
  }

  if (
    responseTimeMs < 2500 &&
    correctStreak >= 3
  ) {
    return 'easy'
  }

  return 'good'
}
7. fsrsScheduler.ts
// src/features/learning/fsrs/fsrsScheduler.ts

import {
  FSRS,
  Rating,
  createEmptyCard,
  type Card,
} from 'ts-fsrs'

import {
  toFsrsRating,
} from './fsrsAdapter'

import type {
  FsrsGrade,
} from '../types'

const fsrs =
  new FSRS()

/**
 * Результат планування.
 */
export interface FsrsScheduleResult {

  card: Card

  nextReviewAt: Date

  grade: FsrsGrade

  /**
   * Інформація для UI/debug.
   */
  intervalDays: number
}

/**
 * Виконує FSRS scheduling.
 */
export function scheduleFsrsReview(
  card: Card,
  now: Date,
  grade: FsrsGrade,
): FsrsScheduleResult {

  const rating =
    toFsrsRating(grade)

  /**
   * ts-fsrs API.
   *
   * У залежності від встановленої версії
   * ts-fsrs сигнатура може відрізнятися.
   *
   * Для актуальних версій перевіряй типи
   * бібліотеки.
   */
  const scheduling =
    fsrs.next(
      card,
      now,
      rating,
    )

  /**
   * Беремо відповідний результат Grade.
   */
  const result =
    scheduling[rating]

  return {

    card:
      result.card,

    nextReviewAt:
      result.card.due,

    grade,

    intervalDays:
      (
        result.card.due.getTime() -
        now.getTime()
      ) /
      (1000 * 60 * 60 * 24),
  }
}

/**
 * Створює FSRS card
 * для нового слова.
 */
export function createFsrsState() {

  const card =
    createEmptyCard()

  return {

    fsrsCard:
      card,

    nextReviewAt:
      card.due,
  }
}
Якщо у твоїй версії ts-fsrs fsrs.next() очікує Grade, а не Rating, саме тут треба зробити адаптацію. Головне — не змішувати Rating і Grade по всій програмі. Я б залишив один внутрішній тип FsrsGrade, а конвертацію тримав виключно в fsrsAdapter.ts.

8. reviewQueue.ts
Тут формується черга.
// src/features/learning/queue/reviewQueue.ts

import type {
  Word,
  WordLearningStats,
  ExerciseSelection,
} from '../types'

import {
  selectExercise,
} from '../exercises/exerciseSelector'

export interface QueueItem {

  word: Word

  stats: WordLearningStats

  exercise: ExerciseSelection

  priority: number
}

/**
 * Чи є слово overdue?
 */
function isOverdue(
  stats: WordLearningStats,
): boolean {

  if (!stats.nextReviewAt) {
    return false
  }

  return (
    stats.nextReviewAt.getTime()
    <= Date.now()
  )
}

/**
 * Розрахунок priority.
 */
function calculatePriority(
  stats: WordLearningStats,
): number {

  /**
   * 1. Низький Mastery = високий priority.
   */
  const mastery =
    (1 - stats.mastery) * 40

  /**
   * 2. Помилки.
   */
  const errors =
    Math.min(
      stats.wrongAnswers * 5,
      25,
    )

  /**
   * 3. Overdue.
   */
  const overdue =
    isOverdue(stats)
      ? 30
      : 0

  /**
   * 4. Correct streak знижує priority.
   */
  const streakPenalty =
    Math.min(
      stats.correctStreak * 2,
      15,
    )

  return (
    mastery +
    errors +
    overdue -
    streakPenalty
  )
}

/**
 * Формує чергу повторення.
 */
export function buildReviewQueue(
  words: Word[],
  statsMap: Map<
    string,
    WordLearningStats
  >,
  limit = 10,
): QueueItem[] {

  const queue =
    words
      .map((word) => {

        const stats =
          statsMap.get(word.id)

        if (!stats) {
          return null
        }

        const exercise =
          selectExercise(
            word,
            stats,
          )

        const priority =
          calculatePriority(
            stats,
          )

        return {

          word,

          stats,

          exercise,

          priority,
        }
      })
      .filter(
        Boolean,
      ) as QueueItem[]

  return queue
    .sort(
      (a, b) =>
        b.priority -
        a.priority,
    )
    .slice(0, limit)
}
9. topicEngine.ts
Це логіка 20/40 слів.
// src/features/learning/topic/topicEngine.ts

import {
  MASTERY_THRESHOLDS,
} from '../constants'

import type {
  TopicProgress,
  WordLearningStats,
} from '../types'

/**
 * Визначає прогрес теми.
 */
export function calculateTopicProgress(
  topicId: string,
  words: WordLearningStats[],
): TopicProgress {

  const topicWords =
    words.filter(
      word =>
        word.topicId === topicId,
    )

  const totalWords =
    topicWords.length

  const newWords =
    topicWords.filter(
      w => w.state === 'new',
    ).length

  const introducedWords =
    topicWords.filter(
      w => w.state === 'introduced',
    ).length

  const learningWords =
    topicWords.filter(
      w => w.state === 'learning',
    ).length

  const consolidatingWords =
    topicWords.filter(
      w => w.state === 'consolidating',
    ).length

  const matureWords =
    topicWords.filter(
      w => w.state === 'mature',
    ).length

  const averageMastery =
    totalWords === 0
      ? 0
      : topicWords.reduce(
          (sum, word) =>
            sum + word.mastery,
          0,
        ) / totalWords

  /**
   * Тема завершена,
   * якщо всі слова mature.
   */
  const completed =
    totalWords > 0 &&
    matureWords === totalWords &&
    averageMastery >=
      MASTERY_THRESHOLDS.MATURE

  return {

    topicId,

    totalWords,

    newWords,

    introducedWords,

    learningWords,

    consolidatingWords,

    matureWords,

    averageMastery,

    completed,
  }
}

/**
 * Вибирає нові слова,
 * які можна відкрити.
 */
export function selectNewWords(
  words: WordLearningStats[],
  limit: number,
): WordLearningStats[] {

  return words
    .filter(
      word =>
        word.state === 'new',
    )
    .sort(
      (a, b) => {

        const priorityA =
          a.mastery

        const priorityB =
          b.mastery

        return (
          priorityA -
          priorityB
        )
      },
    )
    .slice(0, limit)
}

/**
 * Чи можна відкрити наступну Wave?
 *
 * Наприклад:
 *
 * Wave 1 = 10 слів
 * Wave 2 = наступні 10
 */
export function canUnlockNextWave(
  words: WordLearningStats[],
): boolean {

  if (words.length === 0) {
    return false
  }

  const stableWords =
    words.filter(
      word =>
        word.mastery >= 0.65,
    ).length

  const stableRatio =
    stableWords /
    words.length

  /**
   * Мінімум 80% поточної Wave
   * повинні бути хоча б Consolidating.
   */
  return stableRatio >= 0.8
}
10. learningEngine.ts
Це головний facade.
React-компоненти повинні працювати переважно з ним, а не напряму з FSRS.
// src/features/learning/learningEngine.ts

import {
  applyAnswerToMastery,
} from './mastery/masteryEngine'

import {
  gradeMultipleChoice,
} from './fsrs/fsrsAdapter'

import {
  scheduleFsrsReview,
} from './fsrs/fsrsScheduler'

import {
  selectExercise,
} from './exercises/exerciseSelector'

import type {
  ExerciseType,
  Word,
  WordLearningStats,
} from './types'

/**
 * Вхідні дані відповіді.
 */
export interface SubmitAnswerInput {

  word: Word

  stats: WordLearningStats

  exerciseType: ExerciseType

  correct: boolean

  responseTimeMs: number
}

/**
 * Результат відповіді.
 */
export interface SubmitAnswerResult {

  updatedStats: WordLearningStats

  nextExercise?: ReturnType<
    typeof selectExercise
  >
}

/**
 * Головний метод обробки відповіді.
 *
 * Flow:
 *
 * User Answer
 *      │
 *      ├── Mastery Engine
 *      │
 *      ├── Grade
 *      │
 *      ├── FSRS
 *      │
 *      └── Next Exercise
 */
export function submitAnswer(
  input: SubmitAnswerInput,
): SubmitAnswerResult {

  /**
   * 1. Визначаємо FSRS grade.
   */
  const grade =
    gradeMultipleChoice(
      input.correct,
      input.responseTimeMs,
      input.stats.correctStreak,
    )

  /**
   * 2. Оновлюємо Mastery.
   */
  let updatedStats =
    applyAnswerToMastery(
      input.stats,
      {
        exerciseType:
          input.exerciseType,

        correct:
          input.correct,

        responseTimeMs:
          input.responseTimeMs,
      },
    )

  /**
   * 3. Оновлюємо FSRS.
   */
  const fsrsResult =
    scheduleFsrsReview(
      input.stats.fsrsCard,
      new Date(),
      grade,
    )

  /**
   * 4. Зберігаємо FSRS результат.
   */
  updatedStats = {

    ...updatedStats,

    fsrsCard:
      fsrsResult.card,

    nextReviewAt:
      fsrsResult.nextReviewAt,

    updatedAt:
      new Date(),
  }

  /**
   * 5. Визначаємо наступну вправу.
   */
  const nextExercise =
    selectExercise(
      input.word,
      updatedStats,
    )

  return {

    updatedStats,

    nextExercise,
  }
}
11. Як це підключити до твого GameScreen
Твій поточний код має:
onProgressUpdate(
  setId,
  deck[index],
  correct,
)
Я б змінив це на:
onAnswer({
  word: deck[index],
  exerciseType: 'recognition',
  correct,
  responseTimeMs,
})
Наприклад:
const startedAtRef =
  useRef(Date.now())

const handleAnswer = (
  opt: WordModel,
) => {

  if (answered) {
    return
  }

  const responseTimeMs =
    Date.now() -
    startedAtRef.current

  const answerField =
    getAnswerField(direction)

  const current =
    deck[index]

  const correct =
    opt[answerField] ===
    current[answerField]

  setSelected(opt)

  setAnswered(true)

  onAnswer?.({

    word: current,

    exerciseType:
      'recognition',

    correct,

    responseTimeMs,
  })

  // existing UI logic...
}
А батьківський компонент:
const handleAnswer = (
  input: SubmitAnswerInput,
) => {

  const result =
    submitAnswer(input)

  /**
   * Зберегти в IndexedDB.
   */
  await db.wordStats.put(
    result.updatedStats,
  )

  /**
   * Додати ReviewLog.
   */
  await db.reviewLogs.add({
    id: crypto.randomUUID(),

    studentId:
      result.updatedStats.studentId,

    wordId:
      result.updatedStats.wordId,

    topicId:
      result.updatedStats.topicId,

    exerciseType:
      input.exerciseType,

    exerciseVariant:
      'multiple-choice',

    correct:
      input.correct,

    responseTimeMs:
      input.responseTimeMs,

    fsrsGrade:
      gradeMultipleChoice(
        input.correct,
        input.responseTimeMs,
        input.stats.correctStreak,
      ),

    createdAt:
      new Date(),
  })
}
Рекомендований Flow у твоєму PWA
Я б фінально побудував систему так:
                    IndexedDB
                       │
                       ▼
              LearningRepository
                       │
                       ▼
                LearningEngine
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
      Mastery       Exercise       FSRS
      Engine        Selector      Scheduler
          │            │            │
          └────────────┼────────────┘
                       │
                       ▼
                  Review Queue
                       │
                       ▼
                 React GameScreen
                       │
                       ▼
                  User Answer
                       │
                       ▼
                 Submit Answer
                       │
                       ▼
                 Update IndexedDB
Найважливіше розділення
Mastery
│
├── Що учень вміє?
├── Recognition
├── Recall
├── Production
└── Context


FSRS
│
├── Коли учень має повторити слово?
├── Stability
├── Difficulty
├── Retrievability
└── Due Date


Exercise Selector
│
└── Яку вправу показати зараз?


Topic Engine
│
├── Які нові слова відкрити?
└── Чи завершена тема?


Review Queue
│
└── Яке слово показати першим?