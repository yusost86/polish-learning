import { useState } from 'react'
import { WordProgressRecord, WordSetModel, WordModel, getUniqueTopics, isNewWord, isDueForReview, makeWordKey } from '../utils';
import { version } from '../../package.json'


interface MenuScreenProps {
  onSelectWords: (words: Array<{ pl: string; uk: string }>, name: string, setId: string) => void;
  wordSets: WordSetModel[];
  progressData: WordProgressRecord[];
  onDeleteSet: (setId: string) => void;
  onShowStats: () => void;
  onShowWords: () => void;
  onAddSet: (name: string, words: Array<WordModel>) => Promise<string>;
  onAddWordsToSet: (setId: string, words: Array<WordModel>) => Promise<void>;
}

const NEW_SET_OPTION = '__new_set__'

const MenuScreen: React.FC<MenuScreenProps> = (props) => {
  const { onSelectWords, wordSets, progressData, onDeleteSet, onShowStats, onShowWords, onAddSet, onAddWordsToSet } = props;

  const [showPasteModal, setShowPasteModal] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [pasteSetName, setPasteSetName] = useState('Новий набір')
  const [pasteError, setPasteError] = useState('');

  const [showAddWordModal, setShowAddWordModal] = useState(false)
  const [addWordPl, setAddWordPl] = useState('')
  const [addWordUk, setAddWordUk] = useState('')
  const [addWordTopic, setAddWordTopic] = useState('')
  const [addWordTargetSetId, setAddWordTargetSetId] = useState(NEW_SET_OPTION)
  const [addWordNewSetName, setAddWordNewSetName] = useState('Новий набір')
  const [addWordError, setAddWordError] = useState('')
  const [addWordBusy, setAddWordBusy] = useState(false)

  const [showWordSets, setShowWordSets] = useState(false as boolean)

  // Per-set play configuration: which set panel is expanded, and the chosen topic + stage
  const [playConfigSetId, setPlayConfigSetId] = useState(null as string | null)
  const [playConfigTopic, setPlayConfigTopic] = useState('all')
  const [playConfigStage, setPlayConfigStage] = useState('new' as 'new' | 'review')

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

      const words: WordModel[] = data.map((item) => ({
        pl: item.pl,
        uk: item.uk,
        topic: typeof item.topic === 'string' && item.topic.trim() ? item.topic.trim() : undefined,
      }))

      await onAddSet(pasteSetName || 'Новий набір', words)
      alert(`✅ Завантажено: ${words.length} слів!`)
      setShowPasteModal(false)
      setPasteText('')
      setPasteSetName('Новий набір')
    } catch (error: any) {
      setPasteError(`Помилка парсингу: ${error.message}`)
    }
  }

  const openWordSets = () => {
    setShowWordSets(true);
  }

  const openAddWordModal = () => {
    setAddWordError('')
    setAddWordPl('')
    setAddWordUk('')
    setAddWordTopic('')
    setAddWordTargetSetId(wordSets.length > 0 ? wordSets[0].id : NEW_SET_OPTION)
    setAddWordNewSetName('Новий набір')
    setShowAddWordModal(true)
  }

  const handleAddWord = async () => {
    setAddWordError('')
    const pl = addWordPl.trim()
    const uk = addWordUk.trim()
    const topic = addWordTopic.trim()

    if (!pl || !uk) {
      setAddWordError('Заповніть польське і українське слово')
      return
    }

    const word: WordModel = { pl, uk, topic: topic || undefined }

    setAddWordBusy(true)
    try {
      if (addWordTargetSetId === NEW_SET_OPTION) {
        await onAddSet(addWordNewSetName.trim() || 'Новий набір', [word])
      } else {
        await onAddWordsToSet(addWordTargetSetId, [word])
      }
      setShowAddWordModal(false)
      setAddWordPl('')
      setAddWordUk('')
      setAddWordTopic('')
    } catch (error: any) {
      setAddWordError(`Помилка додавання: ${error.message || error}`)
    } finally {
      setAddWordBusy(false)
    }
  }

  const totalUniqueWords = progressData?.length ?? 0
  const learnedWordsCount = progressData?.filter((item) => item.status === 'learned').length ?? 0
  const newWordsCount = progressData?.filter((item) => (item.attempts || 0) === 0).length ?? 0

  // Words in a set filtered by topic, further split by learning stage ('new' vs 'review'), with counts.
  const getFilteredWordsForSet = (set: WordSetModel, topic: string, stage: 'new' | 'review') => {
    const topicWords = topic === 'all' ? set.words : set.words.filter((w) => (w.topic || '').trim() === topic)
    const progressByKey = new Map(progressData.map((p) => [p.wordKey, p]))

    return topicWords.filter((w) => {
      const record = progressByKey.get(makeWordKey(set.id, w))
      if (!record) return stage === 'new'
      return stage === 'new' ? isNewWord(record) : isDueForReview(record)
    })
  }

  const togglePlayConfig = (setId: string) => {
    if (playConfigSetId === setId) {
      setPlayConfigSetId(null)
      return
    }
    setPlayConfigSetId(setId)
    setPlayConfigTopic('all')
    setPlayConfigStage('new')
  }

  const handleStartPlay = (set: WordSetModel) => {
    const words = getFilteredWordsForSet(set, playConfigTopic, playConfigStage)
    if (words.length < 2) {
      alert('❌ У цій категорії немає достатньо слів (потрібно щонайменше 2). Спробуйте інший фільтр.')
      return
    }
    const topicSuffix = playConfigTopic !== 'all' ? ` · ${playConfigTopic}` : ''
    const stageSuffix = playConfigStage === 'new' ? 'нові слова' : 'повторення'
    onSelectWords(words, `${set.name}${topicSuffix} (${stageSuffix})`, set.id)
  }

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
    setItem: { background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', marginBottom: '12px' },
    setItemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    setName: { color: '#fff', fontSize: '14px', fontWeight: 600, flex: 1 },
    btnsContainer: { display: 'flex', gap: '8px' },
    smallBtn: { padding: '12px 16px', fontSize: '15px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 },
    playBtn: { background: 'rgba(72,199,142,0.2)', color: '#48c78e' },
    deleteBtn: { background: 'rgba(241,70,104,0.2)', color: '#f14668' },
    playConfig: { marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' },
    playConfigLabel: { color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' },
    select: { width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '14px' },
    stageToggle: { display: 'flex', gap: '8px', marginBottom: '12px' },
    stageBtn: { flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', fontWeight: 700, fontSize: '13px' },
    stageBtnActive: { background: 'rgba(226,185,111,0.2)', border: '1px solid #e2b96f', color: '#e2b96f' },
    stageBtnInactive: { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)' },
    startBtn: { width: '100%', padding: '12px', background: 'linear-gradient(135deg, #48c78e, #2fa36f)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '14px' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 },
    modalCard: { background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '24px', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflowY: 'auto' },
    modalTitle: { fontSize: '20px', fontWeight: 700, color: '#1a1a2e', marginBottom: '12px' },
    modalDesc: { fontSize: '13px', color: '#666', marginBottom: '16px' },
    modalInput: { width: '100%', padding: '12px', marginBottom: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' },
    modalSelect: { width: '100%', padding: '12px', marginBottom: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px', background: '#fff' },
    modalErrorBox: { background: '#fee', color: '#c33', padding: '12px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' },
    modalBtnRow: { display: 'flex', gap: '12px' },
    modalSaveBtn: { flex: 1, padding: '12px', background: '#48c78e', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '16px' },
    modalCancelBtn: { flex: 1, padding: '12px', background: '#f5f5f5', color: '#1a1a2e', border: '1px solid #ddd', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '16px' },
  }

  return (
    <div style={styles.app}>
      <div style={styles.card}>
        <div style={styles.title as any}>Пол ↔ Укр 🎮</div>
        <div style={styles.subtitle as any}>Версія:{version}</div>
        <div style={styles.subtitle as any}>Завантаж свої слова або грай зі стандартного набору</div>

        <button aria-label="Add a single word" style={{ ...styles.btn, ...styles.primaryBtn }} onClick={openAddWordModal}>
          ➕ Додати слово
        </button>

        <button aria-label="Paste JSON words" style={{ ...styles.btn, ...styles.secondaryBtn }} onClick={() => setShowPasteModal(true)}>
          📋 Вставити JSON фрагмент
        </button>

        <button aria-label="Show word sets" style={{ ...styles.btn, ...styles.secondaryBtn }} onClick={openWordSets}>
          📚 Мої набори слів
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
          <div style={styles.modalOverlay as any}>
            <div style={styles.modalCard as any}>
              <div style={styles.modalTitle}>Вставити JSON фрагмент</div>
              <div style={styles.modalDesc}>Введіть назву набору та JSON масив з полями "pl" (польське), "uk" (українське) і, за бажанням, "topic" (тема, для групування).</div>

              <input type="text" placeholder="Назва набору" value={pasteSetName} onChange={(e) => setPasteSetName(e.target.value)} aria-label="Set name" style={styles.modalInput} />

              <textarea placeholder={'[\n  { "pl": "jabłko", "uk": "яблуко", "topic": "їжа" },\n  { "pl": "pies", "uk": "собака", "topic": "тварини" }\n]'} value={pasteText} onChange={(e) => setPasteText(e.target.value)} aria-label="JSON content" style={{ width: '100%', height: '200px', padding: '12px', marginBottom: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace', resize: 'vertical' } as any} />

              {pasteError && <div style={styles.modalErrorBox as any}>❌ {pasteError}</div>}

              <div style={styles.modalBtnRow}>
                <button onClick={validateAndPasteJSON} aria-label="Validate and save JSON" style={styles.modalSaveBtn}>✅ Зберегти</button>
                <button onClick={() => { setShowPasteModal(false); setPasteText(''); setPasteError('') }} aria-label="Cancel" style={styles.modalCancelBtn}>❌ Скасувати</button>
              </div>
            </div>
          </div>
        )}

        {showAddWordModal && (
          <div style={styles.modalOverlay as any}>
            <div style={styles.modalCard as any}>
              <div style={styles.modalTitle}>Додати слово</div>
              <div style={styles.modalDesc}>Додайте одне слово з темою (наприклад "тварини", "їжа", "робота") — це дозволяє потім фільтрувати слова під час гри.</div>

              <input type="text" placeholder="Польське слово" value={addWordPl} onChange={(e) => setAddWordPl(e.target.value)} aria-label="Polish word" style={styles.modalInput} />
              <input type="text" placeholder="Українське слово" value={addWordUk} onChange={(e) => setAddWordUk(e.target.value)} aria-label="Ukrainian word" style={styles.modalInput} />
              <input type="text" placeholder="Тема (необов'язково)" value={addWordTopic} onChange={(e) => setAddWordTopic(e.target.value)} aria-label="Topic" style={styles.modalInput} />

              <select value={addWordTargetSetId} onChange={(e) => setAddWordTargetSetId(e.target.value)} aria-label="Target set" style={styles.modalSelect}>
                {wordSets.map((set) => (
                  <option key={set.id} value={set.id}>{set.name}</option>
                ))}
                <option value={NEW_SET_OPTION}>➕ Новий набір…</option>
              </select>

              {addWordTargetSetId === NEW_SET_OPTION && (
                <input type="text" placeholder="Назва нового набору" value={addWordNewSetName} onChange={(e) => setAddWordNewSetName(e.target.value)} aria-label="New set name" style={styles.modalInput} />
              )}

              {addWordError && <div style={styles.modalErrorBox as any}>❌ {addWordError}</div>}

              <div style={styles.modalBtnRow}>
                <button onClick={handleAddWord} disabled={addWordBusy} aria-label="Save word" style={styles.modalSaveBtn}>{addWordBusy ? '⏳ Зберігаю…' : '✅ Зберегти'}</button>
                <button onClick={() => { setShowAddWordModal(false); setAddWordError('') }} aria-label="Cancel" style={styles.modalCancelBtn}>❌ Скасувати</button>
              </div>
            </div>
          </div>
        )}

        {showWordSets && (
          <div style={styles.setsList}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
              📦 Твої набори слів:
            </div>
            {wordSets.length === 0 && (
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', textAlign: 'center', padding: '12px 0' }}>Ще немає жодного набору. Додайте слово або вставте JSON.</div>
            )}
            {wordSets.map((set) => {
              const topics = getUniqueTopics(set.words)
              const isOpen = playConfigSetId === set.id
              const newCount = getFilteredWordsForSet(set, playConfigTopic, 'new').length
              const reviewCount = getFilteredWordsForSet(set, playConfigTopic, 'review').length

              return (
                <div key={set.id} style={styles.setItem}>
                  <div style={styles.setItemHeader}>
                    <div>
                      <div style={styles.setName}>{set.name}</div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>{set.words.length} слів{topics.length > 0 ? ` · ${topics.length} тем` : ''}</div>
                    </div>
                    <div style={styles.btnsContainer}>
                      <button aria-label={`Play set ${set.name}`} style={{ ...styles.smallBtn, ...styles.playBtn }} onClick={() => togglePlayConfig(set.id)}>
                        {isOpen ? '▲ Сховати' : '▶️ Грати'}
                      </button>
                      <button aria-label={`Delete set ${set.name}`} style={{ ...styles.smallBtn, ...styles.deleteBtn }} onClick={() => onDeleteSet(set.id)}>
                        ✕
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div style={styles.playConfig}>
                      {topics.length > 0 && (
                        <>
                          <div style={styles.playConfigLabel as any}>Тема</div>
                          <select value={playConfigTopic} onChange={(e) => setPlayConfigTopic(e.target.value)} style={styles.select}>
                            <option value="all">Всі теми</option>
                            {topics.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </>
                      )}

                      <div style={styles.playConfigLabel as any}>Етап навчання</div>
                      <div style={styles.stageToggle}>
                        <button
                          style={{ ...styles.stageBtn, ...(playConfigStage === 'new' ? styles.stageBtnActive : styles.stageBtnInactive) } as any}
                          onClick={() => setPlayConfigStage('new')}
                        >
                          🆕 Нові слова ({newCount})
                        </button>
                        <button
                          style={{ ...styles.stageBtn, ...(playConfigStage === 'review' ? styles.stageBtnActive : styles.stageBtnInactive) } as any}
                          onClick={() => setPlayConfigStage('review')}
                        >
                          🔁 Повторення ({reviewCount})
                        </button>
                      </div>

                      <button style={styles.startBtn} onClick={() => handleStartPlay(set)}>Почати →</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default MenuScreen