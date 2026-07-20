import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDate } from '../utils'

export default function WordsListScreen({ progressData, onBack }) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('date') // 'date', 'nameDesc', 'level'

  // Filter by search query
  const filteredWords = useMemo(
    () =>
      progressData.filter((item) =>
        item.word.pl.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.word.uk.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [progressData, searchQuery]
  )

  // Sort filtered words
  const sortedWords = useMemo(() => {
    const words = [...filteredWords]
    
    switch (sortBy) {
      case 'nameDesc':
        return words.sort((a, b) => b.word.pl.localeCompare(a.word.pl, 'uk'))
      case 'level':
        return words.sort((a, b) => (b.level || 1) - (a.level || 1))
      case 'date':
      default:
        return words.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
    }
  }, [filteredWords, sortBy])

  const styles = {
    app: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      paddingTop: 'max(20px, env(safe-area-inset-top))',
      paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
    },
    card: {
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '24px',
      padding: '24px',
      maxWidth: '600px',
      width: '100%',
      maxHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      paddingBottom: '16px',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
    },
    title: {
      fontSize: '24px',
      fontWeight: 900,
      color: '#e2b96f',
    },
    backBtn: {
      padding: '8px 16px',
      background: 'rgba(255,255,255,0.1)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '8px',
      color: '#fff',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 700,
    },
    listContainer: {
      flex: 1,
      overflowY: 'auto',
      overflowX: 'hidden',
      paddingRight: '8px',
      scrollBehavior: 'smooth',
      WebkitOverflowScrolling: 'touch',
    },
    tableHeader: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr',
      gap: '12px',
      padding: '12px',
      background: 'rgba(226,185,111,0.1)',
      borderRadius: '8px',
      marginBottom: '8px',
      fontSize: '12px',
      fontWeight: 700,
      color: '#e2b96f',
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    },
    wordRow: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr',
      gap: '12px',
      padding: '12px',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      alignItems: 'center',
      fontSize: '14px',
    },
    wordRowHover: {
      background: 'rgba(255,255,255,0.02)',
      transition: 'background 0.2s ease',
    },
    polWord: {
      color: '#fff',
      fontWeight: 700,
    },
    ukWord: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: '13px',
    },
    level: {
      color: '#e2b96f',
      fontWeight: 700,
      fontSize: '13px',
    },
    date: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: '13px',
    },
    detailCard: {
      background: 'rgba(255,255,255,0.08)',
      borderRadius: '18px',
      padding: '20px',
      marginBottom: '20px',
      border: '1px solid rgba(226,185,111,0.15)',
    },
    detailTitle: {
      fontSize: '22px',
      fontWeight: 900,
      color: '#fff',
      marginBottom: '12px',
    },
    detailDivider: {
      height: '1px',
      background: 'rgba(255,255,255,0.1)',
      margin: '12px 0 18px',
    },
    detailRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px',
      marginBottom: '12px',
    },
    detailLabel: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: '13px',
    },
    detailValue: {
      color: '#fff',
      fontSize: '14px',
      fontWeight: 700,
    },
    detailStatus: {
      color: '#48c78e',
      fontWeight: 800,
      fontSize: '14px',
    },
    rowButton: {
      cursor: 'pointer',
    },
    selectedRow: {
      background: 'rgba(226,185,111,0.12)',
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px 20px',
      color: 'rgba(255,255,255,0.5)',
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: '12px',
    },
    filterContainer: {
      display: 'flex',
      gap: '12px',
      marginBottom: '16px',
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    searchInput: {
      flex: 1,
      minWidth: '200px',
      padding: '10px 12px',
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '8px',
      color: '#fff',
      fontSize: '14px',
      fontWeight: 600,
    },
    sortSelect: {
      padding: '10px 12px',
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '8px',
      color: '#fff',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
    },
  }

  const getLevelStars = (level) => {
    const normalizedLevel = Math.max(1, Math.min(5, level || 1))
    return '⭐'.repeat(normalizedLevel)
  }

  const formatShortDate = (isoString) => {
    if (!isoString) return '—'
    const date = new Date(isoString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear()).slice(-2)
    return `${day}/${month}/${year}`
  }

  const formatFullDate = (isoString) => {
    if (!isoString) return '—'
    const date = new Date(isoString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear()).padStart(4, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}.${month}.${year} ${hours}:${minutes}`
  }

  const formatLevelStars = (level) => {
    const normalized = Math.max(1, Math.min(5, level || 1))
    return '⭐'.repeat(normalized) + '☆'.repeat(5 - normalized)
  }

  const getStatusLabel = (status) => {
    return status === 'learned' ? '✅ Вивчене' : '❌ Не вивчене'
  }

  return (
    <div style={styles.app}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.title}>📖 Список слів ({sortedWords.length})</div>
          <button style={styles.backBtn} onClick={onBack}>← Назад</button>
        </div>

        <div style={styles.filterContainer}>
          <input
            type="text"
            placeholder="🔍 Шукати слово..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={styles.sortSelect}>
            <option value="date">📅 По даті додавання</option>
            <option value="nameDesc">🔤 По імені (Я-А)</option>
            <option value="level">⭐ По рівню (desc)</option>
          </select>
        </div>

        <div style={styles.listContainer}>
          {sortedWords.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>{searchQuery ? '🔍' : '📚'}</div>
              <div>{searchQuery ? 'Слова не знайдені' : 'Поки немає слів'}</div>
            </div>
          ) : (
            <>
              <div style={styles.tableHeader}>
                <div>🇵🇱 Слово</div>
                <div>Рівень</div>
                <div>Наступне повторення</div>
              </div>
              {sortedWords.map((item) => (
                <div
                  key={item.wordKey}
                  style={styles.wordRow}
                  onClick={() => navigate(`/word/${encodeURIComponent(item.wordKey)}`)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = styles.wordRowHover.background)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <div style={{ ...styles.polWord, cursor: 'pointer' }}>{item.word.pl}</div>
                  <div style={styles.level}>{formatLevelStars(item.level)}</div>
                  <div style={styles.date}>{formatShortDate(item.nextReviewAt)}</div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
