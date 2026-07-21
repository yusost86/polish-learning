import { useCallback, useEffect, useState } from 'react'
import { shuffle, generateOptions, WordModel } from '../utils'


interface GameScreenProps {
  words: Array<WordModel>
  setName: string
  setId: string
  onProgressUpdate?: (setId: string, word: WordModel, correct: boolean) => void
  onBack: () => void
}

export default function GameScreen({ words, setName, setId, onProgressUpdate, onBack }: GameScreenProps) {
  const [deck, setDeck] = useState([] as WordModel[])
  const [index, setIndex] = useState(0)
  const [options, setOptions] = useState([] as WordModel[])
  const [selected, setSelected] = useState(null as WordModel | null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [streak, setStreak] = useState(0)
  const [_, setBestStreak] = useState(0)
  const [answered, setAnswered] = useState(false)

  const ROUND = Math.min(10, words.length)

  const startGame = useCallback(() => {
    if (words.length < 2) {
      alert('❌ Потрібно щонайменше 2 слова для гри!')
      return
    }

    const d = shuffle(words).slice(0, ROUND)
    setDeck(d)
    setIndex(0)
    setScore(0)
    setStreak(0)
    setFinished(false)
    setSelected(null)
    setAnswered(false)
    setOptions(generateOptions(d[0], words))
  }, [words, ROUND])

  useEffect(() => {
    startGame()
  }, [startGame])

  const handleAnswer = (opt: WordModel) => {
    if (answered) return
    setSelected(opt)
    setAnswered(true)
    const correct = opt.uk === deck[index].uk
    if (onProgressUpdate) {
      onProgressUpdate(setId, deck[index], correct)
    }

    if (correct) {
      setScore((s) => s + 1)
      setStreak((prev) => {
        const next = prev + 1
        setBestStreak((best) => Math.max(best, next))
        return next
      })
    } else {
      setStreak(0)
    }
  }

  const handleNext = () => {
    const next = index + 1
    if (next >= ROUND) {
      setFinished(true)
    } else {
      setIndex(next)
      setOptions(generateOptions(deck[next], words))
      setSelected(null)
      setAnswered(false)
    }
  }

  const stars = score >= ROUND * 0.9 ? 3 : score >= ROUND * 0.7 ? 2 : score >= ROUND * 0.5 ? 1 : 0

  const buttonStyle = (opt: WordModel) => {
    const current = deck[index]
    let bg = 'rgba(255,255,255,0.06)'
    let border = '1px solid rgba(255,255,255,0.1)'
    let color = '#fff'

    if (answered) {
      if (opt.uk === current.uk) {
        bg = 'rgba(72,199,142,0.2)'
        border = '1px solid #48c78e'
        color = '#48c78e'
      } else if (selected?.uk === opt.uk) {
        bg = 'rgba(241,70,104,0.2)'
        border = '1px solid #f14668'
        color = '#f14668'
      }
    }

    return {
      background: bg,
      border,
      borderRadius: '14px',
      padding: '16px 10px',
      color,
      fontSize: '18px',
      fontWeight: 700,
      cursor: answered ? 'default' : 'pointer',
      textAlign: 'center',
    }
  }

  const styles = {
    app: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
    card: { background: 'rgba(255,255,255,0.05)', borderRadius: '24px', padding: '36px 32px', maxWidth: '480px', width: '100%' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '16px' },
    title: { color: '#e2b96f', fontSize: '13px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' },
    setTitle: { color: 'rgba(226,185,111,0.6)', fontSize: '11px', textAlign: 'center', marginBottom: '12px' },
    scoreBar: { color: '#fff', fontSize: '13px', opacity: 0.7, textAlign: 'right' },
    progress: { height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginBottom: '32px', overflow: 'hidden' },
    progressFill: { height: '100%', background: 'linear-gradient(90deg, #e2b96f, #f0d090)', borderRadius: '2px', transition: 'width 0.4s ease', width: `${(index / ROUND) * 100}%` },
    wordBox: { background: 'rgba(226,185,111,0.08)', borderRadius: '16px', padding: '28px 24px', textAlign: 'center', marginBottom: '28px' },
    langLabel: { fontSize: '11px', color: '#e2b96f', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px', display: 'block', opacity: 0.8 },
    word: { fontSize: '38px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px' },
    question: { color: 'rgba(255,255,255,0.5)', fontSize: '13px', textAlign: 'center', marginBottom: '16px' },
    options: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' },
    nextBtn: { width: '100%', padding: '16px', background: 'linear-gradient(135deg, #e2b96f, #c99a40)', border: 'none', borderRadius: '14px', color: '#1a1a2e', fontSize: '16px', fontWeight: 800, cursor: 'pointer' },
    streak: { textAlign: 'center', color: '#e2b96f', fontSize: '13px', marginBottom: '16px', minHeight: '20px' },
    backBtn: { padding: '12px 24px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 700 },
  }

  if (finished) {
    return (
      <div style={styles.app}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 48 }}>{'⭐'.repeat(stars) || '💪'}</span>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginTop: 8 }}>Раунд завершено!</div>
            <div style={{ fontSize: 64, fontWeight: 900, color: '#e2b96f', lineHeight: 1, marginTop: 8 }}>{score}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>з {ROUND} правильних</div>
            <div style={{ marginTop: 24 }}>
              <button style={{ marginRight: 12, padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #e2b96f, #c99a40)', border: 'none', fontWeight: 700 }} onClick={startGame}>🔄 Грати ще раз</button>
              <button style={styles.backBtn} onClick={onBack}>← Назад до меню</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!deck.length) return null

  const current = deck[index]

  return (
    <div style={styles.app}>
      <div style={styles.card}>
        <div style={styles.setTitle as any}>Набір: "{setName}"</div>
        <div style={styles.header}>
          <span style={styles.title}>ПЛ → УКР</span>
          <span style={styles.scoreBar as any}>✓ {score} / {index} ({ROUND - index} лишилось)</span>
        </div>

        <div style={styles.progress}><div style={styles.progressFill} /></div>

        <div style={styles.wordBox as any}>
          <span style={styles.langLabel}>Польське слово</span>
          <div style={styles.word}>{current.pl}</div>
        </div>

        <div style={styles.question as any}>Оберіть переклад українською:</div>

        <div style={styles.options}>
          {options.map((opt) => (
            <button key={opt.uk} style={buttonStyle(opt) as any} onClick={() => handleAnswer(opt)}>
              {opt.uk}
            </button>
          ))}
        </div>

        <div style={styles.streak as any}>
          {answered && selected?.uk === current.uk && streak > 1
            ? `🔥 Серія: ${streak}!`
            : answered && selected?.uk !== current.uk
            ? `Правильно: «${current.uk}»`
            : ''}
        </div>

        {answered && (
          <button style={styles.nextBtn} onClick={handleNext}>{index + 1 >= ROUND ? 'Переглянути результат →' : 'Наступне слово →'}</button>
        )}
      </div>
    </div>
  )
}
