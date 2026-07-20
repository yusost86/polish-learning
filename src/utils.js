export const DEFAULT_WORDS = [
  { pl: 'jabłko', uk: 'яблуко' },
  { pl: 'pies', uk: 'собака' },
  { pl: 'kot', uk: 'кіт' },
  { pl: 'dom', uk: 'будинок' },
  { pl: 'woda', uk: 'вода' },
  { pl: 'chleb', uk: 'хліб' },
  { pl: 'słońce', uk: 'сонце' },
  { pl: 'księżyc', uk: 'місяць' },
  { pl: 'drzewo', uk: 'дерево' },
  { pl: 'kwiat', uk: 'квітка' },
  { pl: 'samochód', uk: 'автомобіль' },
  { pl: 'miasto', uk: 'місто' },
  { pl: 'rzeka', uk: 'річка' },
  { pl: 'góra', uk: 'гора' },
  { pl: 'książka', uk: 'книга' },
  { pl: 'szkoła', uk: 'школа' },
  { pl: 'przyjaciel', uk: 'друг' },
  { pl: 'rodzina', uk: "сім'я" },
  { pl: 'miłość', uk: 'кохання' },
  { pl: 'czas', uk: 'час' },
  { pl: 'okno', uk: 'вікно' },
  { pl: 'drzwi', uk: 'двері' },
  { pl: 'stół', uk: 'стіл' },
  { pl: 'krzesło', uk: 'стілець' },
  { pl: 'lampa', uk: 'лампа' },
  { pl: 'telefon', uk: 'телефон' },
  { pl: 'muzyka', uk: 'музика' },
  { pl: 'jedzenie', uk: 'їжа' },
  { pl: 'herbata', uk: 'чай' },
  { pl: 'kawa', uk: 'кава' },
]

export const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)

export const generateOptions = (correct, all) => {
  const wrong = shuffle(all.filter((w) => w.uk !== correct.uk)).slice(0, 3)
  return shuffle([correct, ...wrong])
}

export const DEFAULT_SET_ID = 'default'
export const REVIEW_INTERVAL_DAYS = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 14 }

export const makeWordKey = (setId, word) => `${setId}|${word.pl}|${word.uk}`

export const formatDate = (isoString) => {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleString('uk-UA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const createBaseWordProgress = (setId, word) => {
  const now = new Date().toISOString()
  return {
    wordKey: makeWordKey(setId, word),
    setId,
    word,
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

export const getNextReviewDate = (level) => {
  const interval = REVIEW_INTERVAL_DAYS[level] ?? 1
  const next = new Date()
  next.setDate(next.getDate() + interval)
  return next.toISOString()
}

export const updateWordProgressRecord = (record, correct) => {
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
