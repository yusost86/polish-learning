import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAppData } from '../hooks/useAppData'
type SortKey = 'dateAsc' | 'dateDesc' | 'nameAsc' | 'nameDesc' | 'levelDesc' | 'levelAsc'

export default function WordsListScreen() {
  const navigate = useNavigate()
  const { progressRecords, loading } = useAppData()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('dateDesc')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = progressRecords.filter(
      (r) => !q || r.word.foreignText.toLowerCase().includes(q) || r.word.nativeText.toLowerCase().includes(q),
    )

    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'nameAsc':
          return a.word.foreignText.localeCompare(b.word.foreignText, 'pl')
        case 'nameDesc':
          return b.word.foreignText.localeCompare(a.word.foreignText, 'pl')
        case 'levelDesc':
          return (b.studentWord?.learningProgress?.mastery ?? 0) - (a.studentWord?.learningProgress?.mastery ?? 0)
        case 'levelAsc':
          return (a.studentWord?.learningProgress?.mastery ?? 0) - (b.studentWord?.learningProgress?.mastery ?? 0)
        case 'dateAsc':
          return a.studentWord?.learningProgress?.nextReviewAt?.localeCompare(b.studentWord?.learningProgress?.nextReviewAt ?? '') ?? 1
        case 'dateDesc':
        default:
          return b.studentWord?.learningProgress?.nextReviewAt?.localeCompare(a.studentWord?.learningProgress?.nextReviewAt ?? '') ?? 1
      }
    })

    return list
  }, [progressRecords, query, sort])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minHeight: 0 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => navigate('/')}
          aria-label="Назад"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 999, width: 38, height: 38, color: 'var(--text)' }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 22 }}>📖 Список слів</h1>
      </header>

      <input
        type="text"
        placeholder="🔍 Шукати слово…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: '100%', padding: '12px 14px', fontSize: 14 }}
      />

      <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} style={{ padding: '10px 12px', fontSize: 13 }}>
        <option value="dateDesc">📅 По наступному повторенню (найближчі спочатку)</option>
        <option value="dateAsc">📅 По наступному додавання (найдальші спочатку)</option>
        <option value="nameAsc">🔤 По імені (А-Я)</option>
        <option value="nameDesc">🔤 По імені (Я-А)</option>
        <option value="levelDesc">⭐ По рівню (спадання)</option>
        <option value="levelAsc">⭐ По рівню (зростання)</option>
      </select>

      <div style={{ display: 'flex', fontSize: 11, color: 'var(--text-faint)', padding: '0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        <div style={{ flex: 2 }}>🇵🇱 Слово</div>
        <div style={{ flex: 1 }}>Mastery</div>
        <div style={{ flex: 1.4, textAlign: 'right' }}>Наступне повторення</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 8 }}>
        {loading && <div style={{ color: 'var(--text-faint)' }}>Завантаження…</div>}
        {!loading && rows.length === 0 && <div style={{ color: 'var(--text-faint)' }}>Нічого не знайдено.</div>}

        {rows.map((r) => {
          const mastery = r.studentWord?.learningProgress?.mastery ?? 0
          const due = r.studentWord ? new Date(r.studentWord.learningProgress?.nextReviewAt ?? r.studentWord.fsrsCard.due) : undefined
          return (
            <button
              key={r.word.id}
              onClick={() => navigate(`/word/${r.word.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-s)',
                padding: '12px 12px',
                textAlign: 'left',
                color: 'var(--text)',
              }}
            >
              <div style={{ flex: 2, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.word.foreignText}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.word.nativeText}
                </div>
              </div>
              <div style={{ flex: 1, fontSize: 13 }}>{r.studentWord ? `${Math.round(mastery * 100)}%` : '🆕'}</div>
              <div className="mono" style={{ flex: 1.4, textAlign: 'right', fontSize: 11, color: 'var(--text-faint)' }}>
                {due ? formatRelative(due) : '—'}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function formatRelative(date: Date): string {
  const diffMs = date.getTime() - Date.now()
  //потртібно огкруго
  const diffDays = Math.round(diffMs / 86400000)
  if (diffDays <= 0) {
    if (diffMs < 0) return 'зараз';
    //need round to minutes 
    const minutes = Math.round(diffMs / 60000)
    if (minutes < 60) return `через ${minutes} хв.`
    const hours = Math.round(diffMs / 3600000)
    if (hours < 24) return `через ${hours} год.`
    return 'зараз'
  }
  else if (diffDays === 1) return 'завтра'
  if (diffDays < 30) return `через ${diffDays} дн.`
  return date.toLocaleDateString('uk-UA')
}
