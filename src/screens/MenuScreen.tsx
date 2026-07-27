import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAppData } from '../hooks/useAppData'
import { parseWordModelJSON, importWordSet, ImportValidationError } from '../learning/import-words'
import { isDue, isLearned } from '../learning/progress'

const EXAMPLE_JSON = `[\n  { "pl": "jabłko", "uk": "яблуко", "topic": "їжа" },\n  { "pl": "pies", "uk": "собака", "topic": "тварини" }\n]`

export default function MenuScreen() {
  const navigate = useNavigate()
  const { topics, progressRecords, summary, loading, reloadAll } = useAppData()

  const [showModal, setShowModal] = useState(false)
  const [setName, setSetName] = useState('')
  const [jsonText, setJsonText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const topicStats = useMemo(() => {
    const map = new Map<string, { total: number; learned: number; due: number, new: number }>()
    for (const r of progressRecords) {
      const t = map.get(r.word.topicId) ?? { total: 0, learned: 0, due: 0, new: 0 }
      t.total += 1
      if (isLearned(r.studentWord)) t.learned += 1
      if (isDue(r.studentWord)) t.due += 1
      if (r.studentWord?.learningProgress?.state === 'new') t.new += 1
      map.set(r.word.topicId, t)
    }
    return map
  }, [progressRecords])

  const closeModal = () => {
    setShowModal(false)
    setJsonText('')
    setSetName('')
    setError(null)
  }

  const handleImport = async () => {
    setError(null)
    try {
      const entries = parseWordModelJSON(jsonText)
      setSaving(true)
      const result = await importWordSet(setName, entries)
      await reloadAll()
      setSaving(false)
      closeModal()
      if (result.wordsCreated === 0) {
        setError('Усі слова вже були у словнику.')
        setShowModal(true)
      }
    } catch (e) {
      setSaving(false)
      setError(e instanceof ImportValidationError ? e.message : 'Щось пішло не так. Спробуйте ще раз.')
    }
  }

  const goDueAll = () => navigate('/game', { state: { mode: 'due' } })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <header>
        <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Pol ↔ Укр
        </div>
        <h1 style={{ fontSize: 28, marginTop: 4 }}>Словник</h1>
      </header>

      <section
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-l)',
          padding: '18px 20px',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: 12 }}>📦 Загальний словник</div>
        <StatRow label="Унікальних слів" value={summary.totalUniqueWords} />
        <StatRow label="Нових слів" value={summary.newWordsCount} />
        <StatRow label="Вивчених слів" value={summary.learnedWordsCount} />
        <StatRow
          label="Прогрес"
          value={`${summary.totalUniqueWords ? Math.round((summary.learnedWordsCount / summary.totalUniqueWords) * 100) : 0}%`}
        />
        {summary.dueNowCount > 0 && (
          <button
            onClick={goDueAll}
            style={{
              marginTop: 14,
              width: '100%',
              padding: '13px 16px',
              borderRadius: 'var(--radius-s)',
              background: 'var(--bad)',
              color: '#241211',
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            🔴 Повторити {summary.dueNowCount} слів
          </button>
        )}
      </section>

      <button
        onClick={() => setShowModal(true)}
        style={{
          padding: '15px 16px',
          borderRadius: 'var(--radius-m)',
          background: 'var(--surface-alt)',
          border: '1px dashed var(--border)',
          color: 'var(--text)',
          fontWeight: 600,
          fontSize: 15,
          textAlign: 'left',
        }}
      >
        📋 Вставити JSON фрагмент
      </button>

      <section>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          📚 Теми
        </div>

        {loading && <div style={{ color: 'var(--text-faint)' }}>Завантаження…</div>}

        {!loading && topics.length === 0 && (
          <div style={{ color: 'var(--text-faint)', fontSize: 14, lineHeight: 1.5 }}>
            Тем ще немає. Додайте перший набір слів через "Вставити JSON фрагмент".
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {topics.map((topic) => {
            const stat = topicStats.get(topic.id) ?? { total: 0, learned: 0, due: 0, new: 0 }
            return (
              <div
                key={topic.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-m)',
                  padding: '14px 16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{topic.name}</div>
                  <div className="mono" style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                    {stat.learned}/{stat.total}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    disabled={stat.total === 0}
                    onClick={() => navigate('/game', { state: { topicId: topic.id, mode: 'new' } })}
                    style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-s)', background: 'var(--gold)', color: '#2a1e0c', fontWeight: 700, fontSize: 13 }}
                  >
                    Вивчити нові {stat.due > 0 ? ` (${stat.new})` : ''}
                  </button>
                  <button
                    onClick={() => navigate('/game', { state: { topicId: topic.id, mode: 'due' } })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 'var(--radius-s)',
                      background: stat.due === 0 ? 'var(--surface-alt)' : 'var(--blue)',
                      color: stat.due === 0 ? 'var(--text-faint)' : '#0d1c2b',
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    Повторити{stat.due > 0 ? ` (${stat.due})` : ''}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <NavButton icon="📊" label="Статистика" onClick={() => navigate('/stats')} />
        <NavButton icon="📖" label="Всі слова" onClick={() => navigate('/words')} />
      </div>

      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(10,10,18,0.72)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50,
          }}
        >
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-l)', padding: 22, width: '100%', maxWidth: 420, maxHeight: '85dvh', overflowY: 'auto' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
              Вставити JSON фрагмент
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 14, lineHeight: 1.5 }}>
              Введіть назву набору та JSON масив з полями "pl" (польське), "uk" (українське) і, за бажанням, "topic" (тема, для групування).
            </div>

            <input
              type="text"
              placeholder="Назва набору"
              value={setName}
              onChange={(e) => setSetName(e.target.value)}
              aria-label="Set name"
              style={{ width: '100%', padding: '11px 12px', marginBottom: 10, fontSize: 14 }}
            />

            <textarea
              placeholder={EXAMPLE_JSON}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              aria-label="JSON content"
              style={{ width: '100%', height: 180, padding: 12, marginBottom: 12, fontSize: 13, fontFamily: 'var(--font-mono)', resize: 'vertical' }}
            />

            {error && (
              <div style={{ background: 'rgba(224,122,99,0.15)', border: '1px solid var(--bad)', color: '#f2beb2', borderRadius: 'var(--radius-s)', padding: '10px 12px', marginBottom: 12, fontSize: 13 }}>
                ❌ {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleImport}
                disabled={saving || !jsonText.trim()}
                aria-label="Validate and save JSON"
                style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-s)', background: 'var(--good)', color: '#0d2019', fontWeight: 700 }}
              >
                {saving ? 'Збереження…' : '✅ Зберегти'}
              </button>
              <button
                onClick={closeModal}
                aria-label="Cancel"
                style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-s)', background: 'var(--surface-alt)', color: 'var(--text)', fontWeight: 700 }}
              >
                ❌ Скасувати
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
      <span style={{ color: 'var(--text-dim)' }}>{label}</span>
      <span className="mono" style={{ fontWeight: 600 }}>{value}</span>
    </div>
  )
}

function NavButton({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '14px 10px', borderRadius: 'var(--radius-m)',
        background: 'var(--surface)', border: '1px solid var(--border)',
        color: 'var(--text)', fontWeight: 600, fontSize: 14,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      {label}
    </button>
  )
}
