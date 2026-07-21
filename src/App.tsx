import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import storage from './storage'
import MenuScreen from './components/MenuScreen'
import GameScreen from './components/GameScreen'
import StatisticsScreen from './components/StatisticsScreen'
import WordsListScreen from './components/WordsListScreen'
import WordDetailScreen from './components/WordDetailScreen'
import { makeWordKey, createBaseWordProgress, updateWordProgressRecord, DEFAULT_SET_ID, WordSetModel, WordProgressRecord, WordModel } from './utils'

export default function App() {
  const navigate = useNavigate()
  const [selectedWords, setSelectedWords] = useState<Array<WordModel>>([])
  const [selectedSetName, setSelectedSetName] = useState('')
  const [selectedSetId, setSelectedSetId] = useState(DEFAULT_SET_ID)
  const [wordSets, setWordSets] = useState([] as Array<WordSetModel>)
  const [progressData, setProgressData] = useState<WordProgressRecord[]>([]);

  const loadWordSets = async () => {
    const sets = await storage.getWordSets()
    setWordSets(sets)
  }

  const loadProgressData = async () => {
    const progress = await storage.getAllWordProgress()
    setProgressData(progress)
  }

  useEffect(() => {
    storage.init().then(async () => {
      await loadWordSets()
      await loadProgressData()
    })
  }, [])

  const ensureProgressRecordsForSet = async (setId: string, words: Array<WordModel>) => {
    const existing = await storage.getWordProgressBySet(setId)
    const existingKeys = new Set(existing.map((item) => item.wordKey))
    const missing = words
      .map((word) => createBaseWordProgress(setId, word))
      .filter((item) => !existingKeys.has(item.wordKey))

    if (missing.length > 0) {
      await Promise.all(missing.map((record) => storage.saveWordProgress(record)))
      setProgressData((prev) => [...prev, ...missing])
    }
  }

  const handleSelectWords = async (words: Array<WordModel>, name: string, setId = DEFAULT_SET_ID) => {
    await ensureProgressRecordsForSet(setId, words)
    setSelectedWords(words)
    setSelectedSetName(name)
    setSelectedSetId(setId)
    navigate('/game')
  }

  const handleAddSet = async (name: string, words: Array<WordModel>) => {
    const id = await storage.addWordSet(name, words)
    await loadWordSets()
    await ensureProgressRecordsForSet(id, words)
    return id
  }

  const handleAddWordsToSet = async (setId: string, words: Array<WordModel>) => {
    await storage.addWordsToSet(setId, words)
    await loadWordSets()
    await ensureProgressRecordsForSet(setId, words)
  }

  const handleProgressUpdate = async (setId: string, word: WordModel, correct: boolean) => {
    const wordKey = makeWordKey(setId, word)
    let record = await storage.getWordProgress(wordKey)
    if (!record) {
      record = createBaseWordProgress(setId, word)
    }

    const updated = updateWordProgressRecord(record, correct)
    await storage.saveWordProgress(updated)
    setProgressData((prev) => {
      const filtered = prev.filter((item) => item.wordKey !== updated.wordKey)
      return [...filtered, updated]
    })
  }

  const handleDeleteSet = async (id: string) => {
    if (window.confirm('Видалити цей набір слів?')) {
      await storage.deleteWordSet(id)
      await storage.deleteProgressForSet(id)
      setWordSets((sets) => sets.filter((s) => s.id !== id))
      setProgressData((items) => items.filter((item) => item.setId !== id))
    }
  }

  const handleBack = async () => {
    navigate('/')
    await loadWordSets()
    await loadProgressData()
  }

  const handleShowStats = () => {
    navigate('/stats')
  }

  const handleShowWords = () => {
    navigate('/words')
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <MenuScreen
            onSelectWords={handleSelectWords}
            wordSets={wordSets}
            progressData={progressData}
            onDeleteSet={handleDeleteSet}
            onShowStats={handleShowStats}
            onShowWords={handleShowWords}
            onAddSet={handleAddSet}
            onAddWordsToSet={handleAddWordsToSet}
          />
        }
      />
      <Route
        path="/game"
        element={
          selectedWords ? (
            <GameScreen
              words={selectedWords}
              setName={selectedSetName}
              setId={selectedSetId}
              onProgressUpdate={handleProgressUpdate}
              onBack={handleBack}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route path="/stats" element={<StatisticsScreen progressData={progressData} onBack={handleBack} onShowWords={handleShowWords} />} />
      <Route path="/words" element={<WordsListScreen progressData={progressData} onBack={handleBack} />} />
      <Route path="/word/:wordKey" element={<WordDetailScreen progressData={progressData} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
