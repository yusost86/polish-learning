import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { WordProgressRecord } from '../utils'


const WordDetailScreen: React.FC<{ progressData: Array<WordProgressRecord> }> = ({ progressData }) => {
  const { wordKey } = useParams()
  const navigate = useNavigate()
  const decodedKey = wordKey ? decodeURIComponent(wordKey) : ''

  const record = useMemo(
    () => progressData.find((item: WordProgressRecord) => item.wordKey === decodedKey),
    [progressData, decodedKey]
  )

  const formatShortDate = (isoString: string) => {
    if (!isoString) return '—'
    const date = new Date(isoString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear()).padStart(4, '0')
    return `${day}.${month}.${year}`
  }

  const formatFullDateTime = (isoString: string) => {
    if (!isoString) return '—'
    const date = new Date(isoString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear()).padStart(4, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}.${month}.${year} ${hours}:${minutes}`
  }

  const formatLevelStars = (level: number) => {
    const normalized = Math.max(1, Math.min(5, level || 1))
    return '⭐'.repeat(normalized) + '☆'.repeat(5 - normalized)
  }

  const getStatusLabel = (status: string) => (status === 'learned' ? '✅ Вивчене' : '❌ Не вивчене')

  if (!record) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '24px', padding: '28px', maxWidth: '520px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#e2b96f', marginBottom: '16px' }}>Слово не знайдено</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '24px' }}>Перевірте, будь ласка, чи існує слово у вашому списку.</div>
          <button style={{ padding: '12px 20px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #e2b96f, #c99a40)', color: '#1a1a2e', fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('/words')}>
            ← Назад до списку
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '24px', padding: '28px', maxWidth: '620px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.35)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>{record.word.pl}</div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px' }}>{record.word.uk}</div>
          </div>
          <button style={{ padding: '10px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', fontWeight: 700 }} onClick={() => navigate('/words')}>
            ← Назад
          </button>
        </div>

        <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', marginBottom: '24px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '8px' }}>Переклад</div>
            <div style={{ color: '#fff', fontWeight: 700 }}>{record.word.uk}</div>
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '8px' }}>Додано</div>
            <div style={{ color: '#fff', fontWeight: 700 }}>{formatShortDate(record.addedAt)}</div>
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '8px' }}>Останнє повторення</div>
            <div style={{ color: '#fff', fontWeight: 700 }}>{formatFullDateTime(record.lastReviewAt as any)}</div>
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '8px' }}>Наступне повторення</div>
            <div style={{ color: '#fff', fontWeight: 700 }}>{formatShortDate(record.nextReviewAt)}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '8px' }}>Рівень</div>
            <div style={{ color: '#e2b96f', fontWeight: 800, fontSize: '18px' }}>{formatLevelStars(record.level)}</div>
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '8px' }}>Streak</div>
            <div style={{ color: '#fff', fontWeight: 700 }}>🔥 {record.streak || 0}</div>
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '8px' }}>Правильно</div>
            <div style={{ color: '#fff', fontWeight: 700 }}>{record.correctCount ?? 0}</div>
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '8px' }}>Неправильно</div>
            <div style={{ color: '#fff', fontWeight: 700 }}>{record.wrongCount ?? 0}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '8px' }}>Точність</div>
            <div style={{ color: '#fff', fontWeight: 700 }}>{record.accuracy ?? 0}%</div>
          </div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '8px' }}>Статус</div>
            <div style={{ color: '#48c78e', fontWeight: 800 }}>{getStatusLabel(record.status)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WordDetailScreen;

