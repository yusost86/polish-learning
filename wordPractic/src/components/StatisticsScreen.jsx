import { formatDate, DEFAULT_SET_ID } from '../utils'

export default function StatisticsScreen({ progressData, onBack, onRepeatNow }) {
  const totalWords = progressData.length
  const learnedWords = progressData.filter((item) => item.status === 'learned').length

  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1)
  const startOfTomorrow = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
  const endOfTomorrow = new Date(startOfTomorrow.getTime() + 24 * 60 * 60 * 1000 - 1)
  const endOfWeek = new Date(startOfDay.getTime() + 7 * 24 * 60 * 60 * 1000)

  const reviewToday = progressData.filter((item) => new Date(item.nextReviewAt) <= endOfDay)
  const reviewTomorrow = progressData.filter((item) => new Date(item.nextReviewAt) > endOfDay && new Date(item.nextReviewAt) <= endOfTomorrow)
  const reviewWeek = progressData.filter((item) => new Date(item.nextReviewAt) > endOfTomorrow && new Date(item.nextReviewAt) <= endOfWeek)

  const toReviewCount = reviewToday.length
  const inProgress = totalWords - learnedWords - toReviewCount

  const progressPercent = totalWords ? Math.round((learnedWords / totalWords) * 100) : 0

  // Activity calculations from history
  const allHistory = progressData.flatMap((item) => (item.history || []).map((h) => ({ ...h, word: item.word.pl, timestamp: h.timestamp })))

  // Set of days (YYYY-MM-DD) with at least one correct answer
  const dayKey = (iso) => new Date(iso).toISOString().slice(0, 10)
  const correctDaysSet = new Set(allHistory.filter((h) => h.correct).map((h) => dayKey(h.timestamp)))

  // compute consecutive streak of days ending today
  let streakDays = 0
  for (let i = 0; ; i++) {
    const d = new Date(startOfDay.getTime() - i * 24 * 60 * 60 * 1000)
    const k = d.toISOString().slice(0, 10)
    if (correctDaysSet.has(k)) streakDays++
    else break
  }

  // Today correct count (unique words answered correctly today)
  const todayCorrectEvents = allHistory.filter((h) => {
    const t = new Date(h.timestamp)
    return h.correct && t >= startOfDay && t <= endOfDay
  })
  const todayCorrectWords = new Set(todayCorrectEvents.map((e) => e.word)).size

  const totalCorrect = progressData.reduce((s, p) => s + (p.correctCount || 0), 0)
  const totalWrong = progressData.reduce((s, p) => s + (p.wrongCount || 0), 0)
  const accuracy = totalCorrect + totalWrong ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) : 0

  const avgStreak = progressData.length ? Math.round(progressData.reduce((s, p) => s + (p.streak || 0), 0) / progressData.length) : 0
  const maxStreak = progressData.reduce((m, p) => Math.max(m, p.streak || 0), 0)

  // levels distribution
  const levelCounts = [0, 0, 0, 0, 0]
  progressData.forEach((p) => {
    const lv = Math.max(1, Math.min(5, p.level || 1))
    levelCounts[lv - 1]++
  })

  const styles = {
    app: { minHeight: '100vh', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
    card: { background: 'rgba(255,255,255,0.05)', borderRadius: '24px', padding: '24px', maxWidth: '980px', width: '100%' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' },
    title: { fontSize: '22px', fontWeight: 900, color: '#e2b96f' },
    dashboard: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' },
    leftCol: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' },
    statBox: { background: 'rgba(255,255,255,0.04)', padding: '14px', borderRadius: '12px' },
    statRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
    statLabel: { color: 'rgba(255,255,255,0.75)' },
    statValue: { color: '#fff', fontWeight: 800 },
    progressBarBg: { background: 'rgba(255,255,255,0.08)', height: '16px', borderRadius: '12px', overflow: 'hidden' },
    progressFill: { height: '100%', background: 'linear-gradient(90deg,#48c78e,#e2b96f)', width: `${progressPercent}%` },
    rightCol: { display: 'flex', flexDirection: 'column', gap: '12px' },
    activityCard: { background: 'rgba(255,255,255,0.04)', padding: '14px', borderRadius: '12px' },
    repeatBtn: { marginTop: '12px', padding: '12px 18px', background: 'linear-gradient(135deg, #48c78e, #2fa36f)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 800 },
    levelsGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginTop: '8px' },
    levelItem: { background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', textAlign: 'center' },
  }

  return (
    <div style={styles.app}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <div style={styles.title}>Статистика прогресу</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Огляд твоєї активності та повторень</div>
          </div>
          <div>
            <button style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', color: '#fff', border: 'none' }} onClick={onBack}>← Назад</button>
          </div>
        </div>

        <div style={styles.dashboard}>
          <div style={styles.leftCol}>
            <div style={styles.statBox}>
              <div style={styles.statRow}><div style={styles.statLabel}>📚 Всього слів</div><div style={styles.statValue}>{totalWords}</div></div>
              <div style={styles.statRow}><div style={styles.statLabel}>✅ Вивчено</div><div style={styles.statValue}>{learnedWords}</div></div>
              <div style={styles.statRow}><div style={styles.statLabel}>🟡 У процесі</div><div style={styles.statValue}>{inProgress}</div></div>
              <div style={styles.statRow}><div style={styles.statLabel}>🔴 Потрібно повторити</div><div style={styles.statValue}>{toReviewCount}</div></div>
            </div>

            <div style={styles.statBox}>
              <div style={{ fontWeight: 800, color: '#fff', marginBottom: 8 }}>🔥 Прогрес</div>
              <div style={styles.progressBarBg}>
                <div style={styles.progressFill} />
              </div>
              <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.8)', fontWeight: 800 }}>{learnedWords} / {totalWords} слів · {progressPercent}%</div>
            </div>
          </div>

          <div style={styles.rightCol}>
            <div style={styles.activityCard}>
              <div style={{ fontWeight: 800, color: '#e2b96f' }}>📅 Активність</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 800 }}>🔥 Серія днів</div>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>{streakDays} днів поспіль</div>
                </div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 800 }}>Сьогодні</div>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>✓ {todayCorrectWords} слів</div>
                </div>
              </div>
            </div>

            <div style={styles.activityCard}>
              <div style={{ fontWeight: 800, color: '#e2b96f' }}>📈 Загальна статистика</div>
              <div style={{ marginTop: 8 }}>
                <div style={styles.statRow}><div style={styles.statLabel}>Правильних відповідей</div><div style={styles.statValue}>{totalCorrect}</div></div>
                <div style={styles.statRow}><div style={styles.statLabel}>Неправильних</div><div style={styles.statValue}>{totalWrong}</div></div>
                <div style={styles.statRow}><div style={styles.statLabel}>Точність</div><div style={styles.statValue}>{accuracy}%</div></div>
                <div style={styles.statRow}><div style={styles.statLabel}>Середній streak</div><div style={styles.statValue}>{avgStreak}</div></div>
                <div style={styles.statRow}><div style={styles.statLabel}>Найдовший streak</div><div style={styles.statValue}>{maxStreak}</div></div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginTop: 12 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12 }}>
            <div style={{ fontWeight: 800, color: '#e2b96f', marginBottom: 8 }}>⏰ Повторення</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'rgba(255,255,255,0.8)' }}>Повторити сьогодні</div>
                <div style={{ fontWeight: 800 }}>{reviewToday.length}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'rgba(255,255,255,0.8)' }}>Завтра</div>
                <div style={{ fontWeight: 800 }}>{reviewTomorrow.length}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'rgba(255,255,255,0.8)' }}>Через тиждень</div>
                <div style={{ fontWeight: 800 }}>{reviewWeek.length}</div>
              </div>
            </div>
            <div>
              <button style={styles.repeatBtn} onClick={() => { if (onRepeatNow) onRepeatNow(); else alert(`Почати повторення: ${reviewToday.length} слів (не налаштовано)`); }}>Повторити зараз →</button>
            </div>
          </div>

          <div style={{ width: 320, background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12 }}>
            <div style={{ fontWeight: 800, color: '#e2b96f' }}>🏆 Рівні знань</div>
            <div style={styles.levelsGrid}>
              <div style={styles.levelItem}>⭐<div style={{ fontWeight: 800 }}>{levelCounts[0]}</div><div style={{ color: 'rgba(255,255,255,0.7)' }}>Рівень 1</div></div>
              <div style={styles.levelItem}>⭐⭐<div style={{ fontWeight: 800 }}>{levelCounts[1]}</div><div style={{ color: 'rgba(255,255,255,0.7)' }}>Рівень 2</div></div>
              <div style={styles.levelItem}>⭐⭐⭐<div style={{ fontWeight: 800 }}>{levelCounts[2]}</div><div style={{ color: 'rgba(255,255,255,0.7)' }}>Рівень 3</div></div>
              <div style={styles.levelItem}>⭐⭐⭐⭐<div style={{ fontWeight: 800 }}>{levelCounts[3]}</div><div style={{ color: 'rgba(255,255,255,0.7)' }}>Рівень 4</div></div>
              <div style={styles.levelItem}>⭐⭐⭐⭐⭐<div style={{ fontWeight: 800 }}>{levelCounts[4]}</div><div style={{ color: 'rgba(255,255,255,0.7)' }}>Рівень 5</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
