import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Rating, type Grade } from 'ts-fsrs'

import { db, LOCAL_STUDENT_ID } from '../db/db'
import { buildSession } from '../learning/session'
import { useLearningSession } from '../hooks/useLearningSession'
import { useAppData } from '../hooks/useAppData'

import type { ExerciseType, StudentWord, Word } from '../domain/types'

interface GameLocationState {
  topicId?: string
  subtopicId?: string
  mode?: 'due' | 'new' | 'mixed'
}

const GRADE_BUTTONS: { grade: Grade; label: string; sub: string; color: string }[] = [
  { grade: Rating.Again, label: 'Ще раз', sub: '<1хв', color: 'var(--bad)' },
  { grade: Rating.Hard, label: 'Важко', sub: '~1д', color: '#d9a86c' },
  { grade: Rating.Good, label: 'Добре', sub: '~3д', color: 'var(--good)' },
  { grade: Rating.Easy, label: 'Легко', sub: '~7д', color: 'var(--blue)' },
]

export default function GameScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as GameLocationState) ?? {}
  const { reloadProgress } = useAppData()

  const [loading, setLoading] = useState(true)
  const [initialCards, setInitialCards] = useState<StudentWord[]>([])
  const [wordsMap, setWordsMap] = useState<Record<string, Word>>({})
  const [revealed, setRevealed] = useState(false)
  const [direction, setDirection] = useState<ExerciseType>('FOREIGN_TO_NATIVE')
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
      const words = await db.words.bulkGet(wordIds)

      const map: Record<string, Word> = {}
      words.forEach((w) => {
        if (w) map[w.id] = w
      })

      setWordsMap(map)
      setInitialCards(allCards)
      setLoading(false)
    })()
  }, [state.topicId, state.subtopicId, state.mode])

  const { currentCard, answer, stats, isFinished } = useLearningSession(initialCards)

  const currentWord = currentCard ? wordsMap[currentCard.wordId] : undefined

  useEffect(() => {
    if (!currentCard) return
    setRevealed(false)
    const options = currentWord?.exerciseTypes.filter((t) => t === 'FOREIGN_TO_NATIVE' || t === 'NATIVE_TO_FOREIGN')
    const pool = options && options.length ? options : ['FOREIGN_TO_NATIVE', 'NATIVE_TO_FOREIGN']
    setDirection(pool[Math.floor(Math.random() * pool.length)] as ExerciseType)
  }, [currentCard, currentWord])

  const handleBackToMenu = async () => {
    await reloadProgress()
    navigate('/')
  }

  const handleGrade = (grade: Grade) => {
    if (!currentWord) return
    const isCorrect = grade !== Rating.Again
    answer(grade, direction, isCorrect)
  }

  const progressPct = useMemo(() => {
    if (stats.total === 0) return 0
    return Math.round((stats.answered / stats.total) * 100)
  }, [stats])

  if (loading) {
    return <Centered><div style={{ color: 'var(--text-faint)' }}>Готуємо картки…</div></Centered>
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

  if (isFinished || !currentCard || !currentWord) {
    return (
      <Centered>
        <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
        <h2 style={{ marginBottom: 6 }}>Сесію завершено</h2>
        <div style={{ color: 'var(--text-dim)', marginBottom: 20, textAlign: 'center' }}>
          Відповідей: <span className="mono">{stats.answered}</span> · Правильно:{' '}
          <span className="mono">{stats.correct}</span>
        </div>
        <BackButton onClick={handleBackToMenu} />
      </Centered>
    )
  }

  const frontText = direction === 'FOREIGN_TO_NATIVE' ? currentWord.foreignText : currentWord.nativeText
  const backText = direction === 'FOREIGN_TO_NATIVE' ? currentWord.nativeText : currentWord.foreignText
  const frontLabel = direction === 'FOREIGN_TO_NATIVE' ? 'PL' : 'UK'
  const backLabel = direction === 'FOREIGN_TO_NATIVE' ? 'UK' : 'PL'
  const edgeColor = direction === 'FOREIGN_TO_NATIVE' ? 'var(--gold)' : 'var(--blue)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={handleBackToMenu}
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

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: 1200 }}>
        <div
          onClick={() => !revealed && setRevealed(true)}
          role="button"
          tabIndex={0}
          aria-label={revealed ? backText : 'Показати переклад'}
          style={{
            width: '100%',
            maxWidth: 340,
            height: 260,
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.5s cubic-bezier(.2,.8,.2,1)',
            transform: revealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
            cursor: revealed ? 'default' : 'pointer',
          }}
        >
          <FaceCard label={frontLabel} text={frontText} edgeColor={edgeColor} hint="Торкніться, щоб перевернути" style={{ backfaceVisibility: 'hidden' }} />
          <FaceCard
            label={backLabel}
            text={backText}
            edgeColor={edgeColor}
            hint=""
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', position: 'absolute', inset: 0 }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, minHeight: 64 }}>
        {revealed &&
          GRADE_BUTTONS.map((b) => (
            <button
              key={b.label}
              onClick={() => handleGrade(b.grade)}
              style={{
                padding: '12px 4px',
                borderRadius: 'var(--radius-m)',
                background: 'var(--surface)',
                border: `1px solid ${b.color}`,
                color: 'var(--text)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 13, color: b.color }}>{b.label}</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--text-faint)' }}>{b.sub}</span>
            </button>
          ))}
        {!revealed && (
          <button
            onClick={() => setRevealed(true)}
            style={{
              gridColumn: '1 / -1',
              padding: '15px',
              borderRadius: 'var(--radius-m)',
              background: 'var(--gold)',
              color: '#2a1e0c',
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            Показати переклад
          </button>
        )}
      </div>
    </div>
  )
}

function FaceCard({
  label,
  text,
  edgeColor,
  hint,
  style,
}: {
  label: string
  text: string
  edgeColor: string
  hint: string
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 'var(--radius-l)',
        background: 'var(--surface)',
        border: `2px solid ${edgeColor}`,
        boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        padding: 24,
        textAlign: 'center',
        ...style,
      }}
    >
      <span
        className="mono"
        style={{ fontSize: 12, fontWeight: 700, color: edgeColor, letterSpacing: '0.12em', textTransform: 'uppercase' }}
      >
        {label}
      </span>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, lineHeight: 1.2 }}>{text}</span>
      {hint && <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{hint}</span>}
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </div>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ padding: '13px 24px', borderRadius: 'var(--radius-m)', background: 'var(--gold)', color: '#2a1e0c', fontWeight: 700 }}
    >
      ← До меню
    </button>
  )
}
