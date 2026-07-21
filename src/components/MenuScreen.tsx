import { useState } from 'react'
import { WordProgressRecord, WordSetModel } from '../utils';
import { version } from '../../package.json'


interface MenuScreenProps {
  onSelectWords: (words: Array<{ pl: string; uk: string }>, name: string, setId: string) => void;
  wordSets: WordSetModel[];
  progressData: WordProgressRecord[];
  onDeleteSet: (setId: string) => void;
  onShowStats: () => void;
  onShowWords: () => void;
  onAddSet: (name: string, words: Array<{ pl: string; uk: string }>) => Promise<string>;
}
const MenuScreen: React.FC<MenuScreenProps> = (props) => {
  const { onSelectWords, wordSets, progressData, onDeleteSet, onShowStats, onShowWords, onAddSet } = props;

  const [showPasteModal, setShowPasteModal] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [pasteSetName, setPasteSetName] = useState('Новий232')
  const [pasteError, setPasteError] = useState('');
  const [displAYwORDSsET, setDisplayWordSet] = useState(null as boolean | null);

  const validateAndPasteJSON = async () => {
    setPasteError('')
    if (!pasteText.trim()) {
      setPasteError('Введіть JSON')
      return
    }


    try {
      const data = JSON.parse(pasteText)

      if (!Array.isArray(data) || data.length === 0) {
        setPasteError('JSON мусить бути масивом з словами')
        return
      }

      const isValid = data.every(
        (item) => item.pl && item.uk && typeof item.pl === 'string' && typeof item.uk === 'string'
      )

      if (!isValid) {
        setPasteError('Кожне слово мусить мати поля "pl" і "uk"')
        return
      }

       await onAddSet(pasteSetName || 'Новий набір111', data)
      alert(`✅ Завантажено: ${data.length} слів!`)
      setShowPasteModal(false)
      setPasteText('')
      setPasteSetName('Новий набір')
    } catch (error: any) {
      setPasteError(`Помилка парсингу: ${error.message}`)
    }
  }
  const opentt = () => {
    setDisplayWordSet(true);
  }

  const totalUniqueWords = progressData?.length ?? 0
  const learnedWordsCount = progressData?.filter((item) => item.status === 'learned').length ?? 0
  const newWordsCount = progressData?.filter((item) => (item.attempts || 0) === 0).length ?? 0

  const styles = {
    app: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
    card: { background: 'rgba(255,255,255,0.05)', borderRadius: '24px', padding: '36px 32px', maxWidth: '500px', width: '100%' },
    title: { fontSize: '32px', fontWeight: 900, color: '#e2b96f', marginBottom: '8px', textAlign: 'center' },
    subtitle: { fontSize: '14px', color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: '32px' },
    btn: { width: '100%', padding: '16px', marginBottom: '12px', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 700, cursor: 'pointer' },
    primaryBtn: { background: 'linear-gradient(135deg, #e2b96f, #c99a40)', color: '#1a1a2e' },
    secondaryBtn: { background: 'rgba(226,185,111,0.1)', border: '1px solid rgba(226,185,111,0.3)', color: '#e2b96f' },
    progressCard: { background: 'rgba(255,255,255,0.03)', borderRadius: '18px', padding: '18px', marginTop: '24px', border: '1px solid rgba(255,255,255,0.08)' },
    progressRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    progressLabel: { color: 'rgba(255,255,255,0.7)', fontSize: '14px' },
    progressValue: { color: '#fff', fontWeight: 700, fontSize: '14px' },
    setsList: { marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' },
    setItem: { background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    setName: { color: '#fff', fontSize: '14px', fontWeight: 600, flex: 1 },
    btnsContainer: { display: 'flex', gap: '8px' },
    smallBtn: { padding: '12px 16px', fontSize: '15px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 },
    playBtn: { background: 'rgba(72,199,142,0.2)', color: '#48c78e' },
    deleteBtn: { background: 'rgba(241,70,104,0.2)', color: '#f14668' },
  }

  return (
    <div style={styles.app}>
      <div style={styles.card}>
        <div style={styles.title as any}>Пол ↔ Укр 🎮</div>
        <div style={styles.subtitle as any}>Версія:{version}</div>
        <div style={styles.subtitle as any}>Завантаж свої слова або грай зі стандартного набору</div>

        <button aria-label="Paste JSON words" style={{ ...styles.btn, ...styles.primaryBtn }} onClick={() => setShowPasteModal(true)}>
          📋 Вставити JSON фрагмент
        </button>

        <button aria-label="Play default word set" style={{ ...styles.btn, ...styles.secondaryBtn }} onClick={opentt}>
          📚 Грати зі стандартного набору (30 слів)
        </button>
        <button aria-label="Show statistics" style={{ ...styles.btn, ...styles.secondaryBtn }} onClick={onShowStats}>
          📊 Статистика прогресу
        </button>

        <button aria-label="Show words list" style={{ ...styles.btn, ...styles.secondaryBtn }} onClick={onShowWords}>
          📖 Всі слова
        </button>

        <div style={styles.progressCard}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#e2b96f', marginBottom: '12px' }}>📦 Загальний словник</div>
          <div style={styles.progressRow}>
            <span style={styles.progressLabel}>Унікальних слів</span>
            <span style={styles.progressValue}>{totalUniqueWords}</span>
          </div>
          <div style={styles.progressRow}>
            <span style={styles.progressLabel}>Нових слів</span>
            <span style={styles.progressValue}>{newWordsCount}</span>
          </div>
          <div style={styles.progressRow}>
            <span style={styles.progressLabel}>Вивчених слів</span>
            <span style={styles.progressValue}>{learnedWordsCount}</span>
          </div>
          <div style={styles.progressRow}>
            <span style={styles.progressLabel}>Прогрес</span>
            <span style={styles.progressValue}>{totalUniqueWords ? Math.round((learnedWordsCount / totalUniqueWords) * 100) : 0}%</span>
          </div>
        </div>

        {showPasteModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 }}>
            <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '24px', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e', marginBottom: '12px' }}>Вставити JSON фрагмент</div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>Введіть назву набору та JSON масив з полями "pl" (польське) і "uk" (українське)</div>

              <input type="text" placeholder="Назва набору" value={pasteSetName} onChange={(e) => setPasteSetName(e.target.value)} aria-label="Set name" style={{ width: '100%', padding: '12px', marginBottom: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }} />

              <textarea placeholder={'[\n  { "pl": "jabłko", "uk": "яблуко" },\n  { "pl": "pies", "uk": "собака" }\n]'} value={pasteText} onChange={(e) => setPasteText(e.target.value)} aria-label="JSON content" style={{ width: '100%', height: '200px', padding: '12px', marginBottom: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace', resize: 'vertical' }} />

              {pasteError && <div style={{ background: '#fee', color: '#c33', padding: '12px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' }}>❌ {pasteError}</div>}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={validateAndPasteJSON} aria-label="Validate and save JSON" style={{ flex: 1, padding: '12px', background: '#48c78e', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '16px' }}>✅ Зберегти</button>
                <button onClick={() => { setShowPasteModal(false); setPasteText(''); setPasteError('') }} aria-label="Cancel" style={{ flex: 1, padding: '12px', background: '#f5f5f5', color: '#1a1a2e', border: '1px solid #ddd', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '16px' }}>❌ Скасувати</button>
              </div>
            </div>
          </div>
        )}
        {
          displAYwORDSsET &&
          (
            <div style={styles.setsList}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                📦 Твої наборі слів:
              </div>
              {wordSets.map((set) => (
                <div key={set.id} style={styles.setItem}>
                  <div>
                    <div style={styles.setName}>{set.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>{set.words.length} слів</div>
                  </div>
                  <div style={styles.btnsContainer}>
                    <button aria-label={`Play set ${set.name}`} style={{ ...styles.smallBtn, ...styles.playBtn }} onClick={() => onSelectWords(set.words, set.name, set.id)}>
                      ▶️ Грати
                    </button>
                    <button aria-label={`Delete set ${set.name}`} style={{ ...styles.smallBtn, ...styles.deleteBtn }} onClick={() => onDeleteSet(set.id)}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

      </div>
    </div>
  )
}



export default MenuScreen