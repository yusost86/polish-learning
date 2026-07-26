import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { db, LOCAL_STUDENT_ID } from '../db/db'
import { buildSession } from '../learning/session'
import { useLearningSession } from '../hooks/useLearningSession'
import { useAppData } from '../hooks/useAppData'
import { maskWord, normalizeAnswer } from '../learning/exercise-plan'
import { selectExercise } from '../features/learning/exercises/exerciseSelector'

import type { ExerciseType, StudentWord, Word } from '../domain/types'
import type { ExerciseType as LearningExerciseType, WordLearningStats } from '../features/learning/types'
import { DifficultyBadge } from './components/DifficultyBadge'
import { MultipleChoiceExercise } from './components/MultipleChoiceExercise'
import { TypeInExercise } from './components/TypeInExercise'
import { Centered } from './components/Centered'
import { BackButton } from './components/BackButton'

interface GameLocationState {
  topicId?: string
  subtopicId?: string
  mode?: 'due' | 'new' | 'mixed'
}

export type InteractionKind = 'MULTIPLE_CHOICE' | 'FILL_BLANK' | 'TYPE_IN'

function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function toLearningWord(word: Word) {
  return { id: word.id, term: word.foreignText, translation: word.nativeText, topicId: word.topicId, subtopicId: word.subtopicId, priority: word.importance }
}

function toLearningStats(card: StudentWord, word: Word): WordLearningStats {
  const progress = card.learningProgress ?? {
    skills: { recognition: 0, recall: 0, production: 0, context: 0 }, mastery: 0, weakestSkill: 'recognition' as const,
    state: 'new' as const, attempts: 0, correctAnswers: 0, wrongAnswers: 0, correctStreak: 0, averageResponseTimeMs: 0,
  }
  const createdAt = new Date(card.createdAt)
  const updatedAt = new Date(card.updatedAt)
  return {
    wordId: card.wordId, studentId: card.studentId, topicId: word.topicId, subtopicId: word.subtopicId,
    state: progress.state, skills: progress.skills, mastery: progress.mastery, weakestSkill: progress.weakestSkill,
    attempts: progress.attempts, correctAnswers: progress.correctAnswers, wrongAnswers: progress.wrongAnswers,
    correctStreak: progress.correctStreak, averageResponseTimeMs: progress.averageResponseTimeMs,
    lastExerciseType: progress.lastExerciseType, lastCorrect: progress.lastCorrect, fsrsCard: card.fsrsCard,
    lastReviewedAt: progress.lastReviewedAt ? new Date(progress.lastReviewedAt) : undefined,
    nextReviewAt: progress.nextReviewAt ? new Date(progress.nextReviewAt) : card.fsrsCard.due,
    createdAt: Number.isNaN(createdAt.getTime()) ? new Date() : createdAt,
    updatedAt: Number.isNaN(updatedAt.getTime()) ? new Date() : updatedAt,
  }
}

/**
 * Loader shell: fetches the session's cards + words once, then hands off to
 * <GameSession> which mounts the learning-session hook fresh with the real
 * data already in hand. Keeping this split matters: if the hook mounted here
 * directly, it would capture an empty card list on the very first render
 * (before the async fetch resolves) and never recover, since useState's
 * lazy initializer only runs once per component instance.
 */
export default function GameScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as GameLocationState) ?? {}
  const { reloadProgress } = useAppData()

  const [loading, setLoading] = useState(true)
  const [initialCards, setInitialCards] = useState<StudentWord[]>([])
  const [wordsMap, setWordsMap] = useState<Record<string, Word>>({})
  const [distractorPool, setDistractorPool] = useState<Word[]>([])
  const [aheadOfSchedule, setAheadOfSchedule] = useState(false)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    ;(async () => {
      const session = await buildSession({
        studentId: LOCAL_STUDENT_ID,
        topicId: state.topicId,
        subtopicId: state.subtopicId,
        mode: state.mode ?? 'mixed',
      })

      const allCards = [...session.reviewCards, ...session.newCards]
      const wordIds = Array.from(new Set(allCards.map((c) => c.wordId)))
      const [words, allWords] = await Promise.all([db.words.bulkGet(wordIds), db.words.toArray()])

      const map: Record<string, Word> = {}
      words.forEach((w) => {
        if (w) map[w.id] = w
      })

      setWordsMap(map)
      setDistractorPool(allWords)
      setInitialCards(allCards)
      setAheadOfSchedule(session.aheadOfSchedule)
      setLoading(false)
    })()
  }, [state.topicId, state.subtopicId, state.mode])

  const handleBackToMenu = async () => {
    await reloadProgress()
    navigate('/')
  }

  if (loading) {
    return (
      <Centered>
        <div style={{ color: 'var(--text-faint)' }}>Готуємо картки…</div>
      </Centered>
    )
  }

  if (initialCards.length === 0) {
    return (
      <Centered>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🎉</div>
        <div style={{ fontSize: 16, color: 'var(--text-dim)', marginBottom: 20, textAlign: 'center' }}>
          Немає слів для цієї сесії просто зараз.
        </div>
        <BackButton onClick={handleBackToMenu} />
      </Centered>
    )
  }

  return (
    <GameSession
      initialCards={initialCards}
      wordsMap={wordsMap}
      distractorPool={distractorPool}
      aheadOfSchedule={aheadOfSchedule}
      onBackToMenu={handleBackToMenu}
    />
  )
}

function GameSession({
  initialCards,
  wordsMap,
  distractorPool,
  aheadOfSchedule,
  onBackToMenu,
}: {
  initialCards: StudentWord[]
  wordsMap: Record<string, Word>
  distractorPool: Word[]
  aheadOfSchedule: boolean
  onBackToMenu: () => void
}) {
  const { currentCard, answer, stats, isFinished } = useLearningSession(initialCards)

  const [direction, setDirection] = useState<ExerciseType>('FOREIGN_TO_NATIVE')
  const [kind, setKind] = useState<InteractionKind>('MULTIPLE_CHOICE')
  const [learningExerciseType, setLearningExerciseType] = useState<LearningExerciseType>('recognition')
  const [blanks, setBlanks] = useState(0)
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [typedValue, setTypedValue] = useState('')
  const [typedSubmitted, setTypedSubmitted] = useState(false)
  const [typedCorrect, setTypedCorrect] = useState(false)

  const currentWord = currentCard ? wordsMap[currentCard.wordId] : undefined

  // Pick a fresh direction + difficulty tier whenever the card changes.
  useEffect(() => {
    if (!currentCard || !currentWord) return

    setSelectedChoice(null)
    setTypedValue('')
    setTypedSubmitted(false)
    setTypedCorrect(false)

    const canDoMultipleChoice = currentWord.exerciseTypes.includes('MULTIPLE_CHOICE') && distractorPool.length >= 4
    const exercise = selectExercise(toLearningWord(currentWord), toLearningStats(currentCard, currentWord))
    setLearningExerciseType(exercise.type)

    switch (exercise.variant) {
      case 'multiple-choice':
        setDirection('FOREIGN_TO_NATIVE')
        setKind(canDoMultipleChoice ? 'MULTIPLE_CHOICE' : 'TYPE_IN')
        setBlanks(0)
        break
      case 'reverse-multiple-choice':
        setDirection('NATIVE_TO_FOREIGN')
        setKind(canDoMultipleChoice ? 'MULTIPLE_CHOICE' : 'TYPE_IN')
        setBlanks(0)
        break
      case 'sentence-completion':
        setDirection('FOREIGN_TO_NATIVE')
        setKind('FILL_BLANK')
        setBlanks(Math.max(1, Math.ceil(currentWord.nativeText.length / 5)))
        break
      case 'translation':
      case 'mixed-recall':
      case 'typing':
        setDirection('NATIVE_TO_FOREIGN')
        setKind('TYPE_IN')
        setBlanks(0)
        break
    }
  }, [currentCard, currentWord, distractorPool])

  const frontText = currentWord ? (direction === 'FOREIGN_TO_NATIVE' ? currentWord.foreignText : currentWord.nativeText) : ''
  const backText = currentWord ? (direction === 'FOREIGN_TO_NATIVE' ? currentWord.nativeText : currentWord.foreignText) : ''
  const frontLabel = direction === 'FOREIGN_TO_NATIVE' ? 'PL' : 'UK'
  const edgeColor = direction === 'FOREIGN_TO_NATIVE' ? 'var(--gold)' : 'var(--blue)'

  const maskedHint = useMemo(() => {
    if (kind !== 'FILL_BLANK' || !backText) return undefined
    return maskWord(backText, blanks)
  }, [kind, backText, blanks])

  const choiceOptions = useMemo(() => {
    if (kind !== 'MULTIPLE_CHOICE' || !currentWord) return []

    const getAnswerText = (w: Word) => (direction === 'FOREIGN_TO_NATIVE' ? w.nativeText : w.foreignText)
    const correctText = getAnswerText(currentWord)

    const others = distractorPool.filter((w) => w.id !== currentWord.id && getAnswerText(w) !== correctText)
    const distractors = shuffled(others).slice(0, 3).map((w) => getAnswerText(w))

    return shuffled([correctText, ...distractors])
  }, [kind, currentWord, direction, distractorPool])

  const progressPct = useMemo(() => {
    if (stats.total === 0) return 0
    return Math.round((stats.answered / stats.total) * 100)
  }, [stats])

  const handleChoice = (choice: string) => {
    if (!currentWord || selectedChoice) return
    setSelectedChoice(choice)
    const isCorrect = choice === backText
    window.setTimeout(() => {
      answer({
        word: currentWord,
        learningExerciseType,
        exerciseType: direction,
        isCorrect,
      })
    }, 650)
  }

  const handleTypedSubmit = () => {
    if (!currentWord || typedSubmitted || !typedValue.trim()) return
    const isCorrect = normalizeAnswer(typedValue) === normalizeAnswer(backText)
    setTypedSubmitted(true)
    setTypedCorrect(isCorrect)
    window.setTimeout(() => {
      answer({
        word: currentWord,
        learningExerciseType,
        exerciseType: direction,
        isCorrect,
      })
    }, 900)
  }

  if (isFinished || !currentCard || !currentWord) {
    return (
      <Centered>
        <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
        <h2 style={{ marginBottom: 6 }}>Сесію завершено</h2>
        <div style={{ color: 'var(--text-dim)', marginBottom: 20, textAlign: 'center' }}>
          Відповідей: <span className="mono">{stats.answered}</span> · Правильно:{' '}
          <span className="mono">{stats.correct}</span>
        </div>
        <BackButton onClick={onBackToMenu} />
      </Centered>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onBackToMenu}
          aria-label="Назад"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 999, width: 38, height: 38, color: 'var(--text)', fontSize: 16 }}
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ height: 6, background: 'var(--surface-alt)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--gold)', transition: 'width .3s ease' }} />
          </div>
        </div>
        <div className="mono" style={{ fontSize: 13, color: 'var(--text-faint)', minWidth: 36, textAlign: 'right' }}>
          {stats.answered}/{stats.total}
        </div>
      </header>

      {aheadOfSchedule && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-dim)',
            background: 'var(--surface-alt)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-s)',
            padding: '8px 12px',
          }}
        >
          ⏱ Нових слів і прострочених повторень поки немає — ось найближчі слова наперед графіка.
        </div>
      )}

      <DifficultyBadge kind={kind} />

      {kind === 'MULTIPLE_CHOICE' ? (
        <MultipleChoiceExercise
          promptLabel={frontLabel}
          promptText={frontText}
          edgeColor={edgeColor}
          options={choiceOptions}
          correctText={backText}
          selected={selectedChoice}
          onSelect={handleChoice}
        />
      ) : (
        <TypeInExercise
          key={currentCard.id}
          promptLabel={frontLabel}
          promptText={frontText}
          edgeColor={edgeColor}
          maskedHint={maskedHint}
          correctText={backText}
          value={typedValue}
          onChange={setTypedValue}
          submitted={typedSubmitted}
          isCorrect={typedCorrect}
          onSubmit={handleTypedSubmit}
        />
      )}
    </div>
  )
}


