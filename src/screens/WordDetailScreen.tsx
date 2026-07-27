import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useAppData } from '../hooks/useAppData'
import { getReviewEventsForWord } from '../learning/progress'

import type {LearningWordState, ReviewEvent } from '../domain/types'
import { MasteryInfo } from './components/MasteryInfo'

export default function WordDetailScreen() {
  const { wordId } = useParams<{ wordId: string }>()
  const navigate = useNavigate()
  const { progressRecords } = useAppData()
  const [events, setEvents] = useState<ReviewEvent[]>([])

  const record = progressRecords.find((r) => r.word.id === wordId)

  useEffect(() => {
    if (!wordId) return
    getReviewEventsForWord(wordId).then((evts) => setEvents(evts.reverse()))
  }, [wordId])

  if (!record) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <BackHeader onBack={() => navigate('/words')} />
        <div style={{ color: 'var(--text-faint)' }}>Слово не знайдено.</div>
      </div>
    )
  }

  const { word, studentWord, topicName } = record
 // const learning = studentWord?.learningProgress
  const accuracy =
    studentWord && studentWord.correctCount + studentWord.incorrectCount > 0
      ? Math.round((studentWord.correctCount / (studentWord.correctCount + studentWord.incorrectCount)) * 100)
      : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <BackHeader onBack={() => navigate('/words')} />

      <section
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--gold)',
          borderRadius: 'var(--radius-l)',
          padding: '24px 20px',
          textAlign: 'center',
        }}
      >
        <div className="mono" style={{ fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          PL
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, margin: '6px 0 14px' }}>
          {word.foreignText}
        </div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          UK
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, marginTop: 6 }}>{word.nativeText}</div>
        <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-faint)' }}>Тема: {topicName}</div>
      </section>

      <MasteryInfo studentWord={studentWord} accuracy={accuracy} />

      <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-l)', padding: '16px 18px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: 10 }}>Історія повторень</div>
        {events.length === 0 && <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>Ще немає жодного повторення.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {events.slice(0, 20).map((e) => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-faint)' }}>{new Date(e.timestamp).toLocaleDateString('uk-UA')}</span>
              <span style={{ color: e.isCorrect ? 'var(--good)' : 'var(--bad)' }}>{e.isCorrect ? '✔ правильно' : '✘ помилка'}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export function stateLabel(state: LearningWordState): string {
  return { new: 'Нове', introduced: 'Ознайомлене', learning: 'У навчанні', consolidating: 'Закріплюється', mature: 'Засвоєне' }[state]
}

function BackHeader({ onBack }: { onBack: () => void }) {
  return (
    <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button
        onClick={onBack}
        aria-label="Назад"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 999, width: 38, height: 38, color: 'var(--text)' }}
      >
        ←
      </button>
      <h1 style={{ fontSize: 20 }}>Інфо про слово</h1>
    </header>
  )
}

export function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
      <span style={{ color: 'var(--text-dim)' }}>{label}</span>
      <span className="mono" style={{ fontWeight: 600 }}>{value}</span>
    </div>
  )
}
