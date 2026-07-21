export const DEFAULT_WORDS: Array<WordModel> = [
  { pl: 'jabłko', uk: 'яблуко' }
]

export const shuffle = (arr: Array<WordModel>) => [...arr].sort(() => Math.random() - 0.5)

// Direction of translation for a single game question:
// 'pl-uk' = show Polish word, pick Ukrainian answer
// 'uk-pl' = show Ukrainian word, pick Polish answer
export type Direction = 'pl-uk' | 'uk-pl'

export const pickRandomDirection = (): Direction => (Math.random() < 0.5 ? 'pl-uk' : 'uk-pl')

export const getQuestionField = (direction: Direction): 'pl' | 'uk' => (direction === 'pl-uk' ? 'pl' : 'uk')
export const getAnswerField = (direction: Direction): 'pl' | 'uk' => (direction === 'pl-uk' ? 'uk' : 'pl')

export const generateOptions = (correct: WordModel, all: Array<WordModel>, direction: Direction = 'pl-uk') => {
  const answerField = getAnswerField(direction)
  const wrong = shuffle(all.filter((w) => w[answerField] !== correct[answerField])).slice(0, 3)
  return shuffle([correct, ...wrong])
}

export const DEFAULT_SET_ID = 'default'

export type REVIEW_INTERVAL_DAYSModel = {
  [level: number]: number
}
export const REVIEW_INTERVAL_DAYS: REVIEW_INTERVAL_DAYSModel = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 14 }


export interface WordSetModel {
  id: string,
  name: string
  words: Array<WordModel>,
  createdAt: string
}
export interface WordModel {
  pl: string,
  uk: string,
  topic?: string
}
export const makeWordKey = (setId: string, word: WordModel) => `${setId}|${word.pl}|${word.uk}`

// Returns the sorted list of unique, non-empty topics found among a list of words.
export const getUniqueTopics = (words: Array<WordModel>): string[] => {
  const topics = new Set<string>()
  words.forEach((w) => {
    if (w.topic && w.topic.trim()) topics.add(w.topic.trim())
  })
  return Array.from(topics).sort((a, b) => a.localeCompare(b, 'uk'))
}

export const formatDate = (isoString: string | null | undefined) => {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleString('uk-UA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const createBaseWordProgress = (setId: string, word: WordModel): WordProgressRecord => {
  const now = new Date().toISOString()
  return {
    wordKey: makeWordKey(setId, word),
    setId,
    word,
    topic: word.topic || null,
    addedAt: now,
    status: 'not learned',
    correctCount: 0,
    wrongCount: 0,
    attempts: 0,
    accuracy: 0,
    lastReviewAt: null,
    nextReviewAt: now,
    level: 1,
    streak: 0,
    history: [],
  }
}

export const getNextReviewDate = (level: number) => {
  const interval = REVIEW_INTERVAL_DAYS[level] ?? 1
  const next = new Date()
  next.setDate(next.getDate() + interval)
  return next.toISOString()
}

export interface WordProgressRecord {
  wordKey: string,
  setId: string,
  word: WordModel,
  topic?: string | null,
  addedAt: string,
  status: 'not learned' | 'learned',
  lastReviewAt: string | null,
  nextReviewAt: string,
  correctCount: number,
  wrongCount: number,
  attempts: number,
  accuracy: number,
  streak: number,
  level: number,
  history: Array<{
    timestamp: string,
    correct: boolean,
    level: number,
    streak: number,
    attempts: number,
    accuracy: number,
  }>
}

// Stage 1: word has never been answered yet.
export const isNewWord = (record: WordProgressRecord) => (record.attempts || 0) === 0

// Stage 2: word was already seen at least once and its scheduled review date has arrived.
export const isDueForReview = (record: WordProgressRecord) => {
  if ((record.attempts || 0) === 0) return false
  return new Date(record.nextReviewAt).getTime() <= Date.now()
}

export const updateWordProgressRecord = (record: WordProgressRecord, correct: boolean): WordProgressRecord => {
  const now = new Date().toISOString()
  const correctCount = record.correctCount + (correct ? 1 : 0)
  const wrongCount = record.wrongCount + (correct ? 0 : 1)
  const attempts = record.attempts + 1
  const streak = correct ? record.streak + 1 : 0
  let level = record.level

  if (correct) {
    level = Math.min(5, level + 1)
    if (streak >= 5) {
      level = 5
    }
  } else {
    level = Math.max(1, level - 1)
  }

  const status = level >= 5 || streak >= 5 ? 'learned' : 'not learned'
  const accuracy = attempts ? Math.round((correctCount / attempts) * 100) : 0
  const nextReviewAt = correct ? getNextReviewDate(level) : getNextReviewDate(1)

  return {
    ...record,
    correctCount,
    wrongCount,
    attempts,
    accuracy,
    streak,
    level,
    status,
    lastReviewAt: now,
    nextReviewAt,
    history: [
      ...(record.history || []),
      {
        timestamp: now,
        correct,
        level,
        streak,
        attempts,
        accuracy,
      },
    ],
  }
}
