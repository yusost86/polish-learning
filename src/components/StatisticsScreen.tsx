import React from "react"
import { WordProgressRecord } from "../utils"

interface StatisticsScreenProps {
  progressData: Array<WordProgressRecord>,
  onBack: () => void,
  onRepeatNow?: () => void,
  onShowWords: () => void,
}


const StatisticsScreen: React.FC<StatisticsScreenProps> = (props: StatisticsScreenProps) => {

  const { progressData, onBack, onRepeatNow, onShowWords } = props;

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
  const dayKey = (iso:string) => new Date(iso).toISOString().slice(0, 10)
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
    app: { minHeight: '100vh', fontSize: '14px', overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '12px', paddingTop: 'max(12px, env(safe-area-inset-top))', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' },
    card: { background: 'rgba(255,255,255,0.05)', borderRadius: '18px', padding: '14px', maxWidth: '980px', width: '100%', margin: '0 auto' },
    header: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' },
    title: { fontSize: 'clamp(18px, 5vw, 24px)', fontWeight: 900, color: '#e2b96f' },
    dashboard: { display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginBottom: '10px' },
    leftCol: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' },
    statBox: { background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '8px' },
    statRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px', fontSize: 'clamp(11px, 3vw, 13px)' },
    statLabel: { color: 'rgba(255,255,255,0.75)', flex: 1 },
    statValue: { color: '#fff', fontWeight: 800, marginLeft: '6px' },
    progressBarBg: { background: 'rgba(255,255,255,0.08)', height: '12px', borderRadius: '8px', overflow: 'hidden' },
    progressFill: { height: '100%', background: 'linear-gradient(90deg,#48c78e,#e2b96f)', width: `${progressPercent}%` },
    rightCol: { display: 'grid', gridTemplateColumns: '1fr', gap: '8px' },
    activityCard: { background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '8px' },
    repeatBtn: { marginTop: '8px', padding: '9px 12px', background: 'linear-gradient(135deg, #48c78e, #2fa36f)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, fontSize: 'clamp(12px, 3vw, 14px)' },
    levelsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(55px, 1fr))', gap: '5px', marginTop: '6px' },
    levelItem: { background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '6px', textAlign: 'center', fontSize: '11px' },
  }

  return (
    <div style={{ ...styles.app } as any}>
      <div style={styles.card}>
        <div style={styles.header as any}>
          <div>
            <div style={styles.title}>Статистика прогресу</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(12px, 3vw, 13px)' }}>Огляд твоєї активності та повторень</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: '#fff', border: 'none', fontSize: 'clamp(12px, 3vw, 14px)', cursor: 'pointer' }} onClick={onShowWords}>📖 Слова</button>
            <button style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: '#fff', border: 'none', fontSize: 'clamp(12px, 3vw, 14px)', cursor: 'pointer' }} onClick={onBack}>← Назад</button>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 6 }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8 }}>
            <div style={{ fontWeight: 800, color: '#e2b96f', marginBottom: 6, fontSize: 'clamp(13px, 4vw, 15px)' }}>⏰ Повторення</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: 6 }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(11px, 3vw, 12px)' }}>Повторити</div>
                <div style={{ fontWeight: 800, fontSize: 'clamp(15px, 4vw, 17px)' }}>{reviewToday.length}</div>
              </div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(11px, 3vw, 12px)' }}>Завтра</div>
                <div style={{ fontWeight: 800, fontSize: 'clamp(15px, 4vw, 17px)' }}>{reviewTomorrow.length}</div>
              </div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(11px, 3vw, 12px)' }}>Тиждень</div>
                <div style={{ fontWeight: 800, fontSize: 'clamp(15px, 4vw, 17px)' }}>{reviewWeek.length}</div>
              </div>
            </div>
            <button style={styles.repeatBtn} onClick={() => { if (onRepeatNow) onRepeatNow(); else alert(`Почати повторення: ${reviewToday.length} слів`); }}>Повторити →</button>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8 }}>
            <div style={{ fontWeight: 800, color: '#e2b96f', fontSize: 'clamp(13px, 4vw, 15px)' }}>🏆 Рівні знань</div>
            <div style={styles.levelsGrid}>
              <div style={styles.levelItem as any}>⭐<div style={{ fontWeight: 800 }}>{levelCounts[0]}</div></div>
              <div style={styles.levelItem as any}>⭐⭐<div style={{ fontWeight: 800 }}>{levelCounts[1]}</div></div>
              <div style={styles.levelItem as any}>⭐⭐⭐<div style={{ fontWeight: 800 }}>{levelCounts[2]}</div></div>
              <div style={styles.levelItem as any}>⭐⭐⭐⭐<div style={{ fontWeight: 800 }}>{levelCounts[3]}</div></div>
              <div style={styles.levelItem as any}>⭐⭐⭐⭐⭐<div style={{ fontWeight: 800 }}>{levelCounts[4]}</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


export default StatisticsScreen