import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAppData } from '../hooks/useAppData'
import { LOCAL_STUDENT_ID } from '../db/db'
import { computeAccuracyStats, starLevel, type AccuracyStats } from '../learning/progress'

export default function StatisticsScreen() {
  const navigate = useNavigate()
  const { progressRecords, summary } = useAppData()
  const [accuracy, setAccuracy] = useState<AccuracyStats | null>(null)

  useEffect(() => {
    computeAccuracyStats(LOCAL_STUDENT_ID).then(setAccuracy)
  }, [progressRecords])

  const starCounts = [0, 0, 0, 0, 0, 0]
  for (const r of progressRecords) {
    starCounts[starLevel(r.studentWord)] += 1
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Header title="Статистика" onBack={() => navigate('/')} />

      <Card title="📚 Загальна статистика">
        <Row label="Всього слів" value={summary.totalUniqueWords} />
        <Row label="✅ Вивчено" value={summary.learnedWordsCount} />
        <Row label="🟡 У процесі" value={summary.totalUniqueWords - summary.learnedWordsCount - summary.newWordsCount} />
        <Row label="🔴 Потрібно повторити" value={summary.dueNowCount} />
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 6 }}>🔥 Прогрес</div>
          <Bar pct={summary.totalUniqueWords ? Math.round((summary.learnedWordsCount / summary.totalUniqueWords) * 100) : 0} />
        </div>
      </Card>

      {accuracy && (
        <Card title="🎯 Точність відповідей">
          <Row label="Правильних відповідей" value={accuracy.correct} />
          <Row label="Неправильних" value={accuracy.incorrect} />
          <Row label="Точність" value={`${accuracy.accuracyPct}%`} />
          <Row label="Середній streak" value={accuracy.averageStreak} />
          <Row label="Найдовший streak" value={accuracy.longestStreak} />
        </Card>
      )}

      <Card title="⭐ Рівні слів">
        {[5, 4, 3, 2, 1, 0].map((lvl) => (
          <Row key={lvl} label={starLabel(lvl)} value={starCounts[lvl]} />
        ))}
      </Card>
    </div>
  )
}

function starLabel(level: number): string {
  if (level === 0) return 'Нові'
  return '⭐'.repeat(level)
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button
        onClick={onBack}
        aria-label="Назад"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 999, width: 38, height: 38, color: 'var(--text)' }}
      >
        ←
      </button>
      <h1 style={{ fontSize: 22 }}>{title}</h1>
    </header>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-l)', padding: '16px 18px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: 10 }}>{title}</div>
      {children}
    </section>
  )
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
      <span style={{ color: 'var(--text-dim)' }}>{label}</span>
      <span className="mono" style={{ fontWeight: 600 }}>{value}</span>
    </div>
  )
}

function Bar({ pct }: { pct: number }) {
  return (
    <div style={{ height: 8, background: 'var(--surface-alt)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--gold), var(--blue))' }} />
    </div>
  )
}
