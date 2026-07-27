import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { db, LOCAL_STUDENT_ID } from '../db/db'
import { buildSession, LearningWordType } from '../learning/session'
import { useAppData } from '../hooks/useAppData'

import type { ExerciseType, StudentWord, Word } from '../domain/types'
import type { ExerciseType as LearningExerciseType } from '../features/learning/types'
import { Centered } from './components/Centered'
import { BackButton } from './components/BackButton'
import { GameSession } from './GameSession'

interface GameLocationState {
  topicId?: string
  subtopicId?: string
  mode?:LearningWordType
}

export type InteractionKind = 'MULTIPLE_CHOICE' | 'FILL_BLANK' | 'TYPE_IN'

export function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
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

      ; (async () => {
        const session = await buildSession({
          studentId: LOCAL_STUDENT_ID,
          topicId: state.topicId,
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

export interface GameSessionModel {
  direction: ExerciseType,
  kind: InteractionKind,
  blanks: number,
  learningExerciseType: LearningExerciseType

}

