import { useEffect, useState } from 'react'
import storage from './storage'
import MenuScreen from './components/MenuScreen'
import GameScreen from './components/GameScreen'
import StatisticsScreen from './components/StatisticsScreen'
import { makeWordKey, createBaseWordProgress, updateWordProgressRecord, DEFAULT_SET_ID } from './utils'

export default function App() {
  const [screen, setScreen] = useState('menu')
  const [selectedWords, setSelectedWords] = useState(null)
  const [selectedSetName, setSelectedSetName] = useState('')
  const [selectedSetId, setSelectedSetId] = useState(DEFAULT_SET_ID)
  const [wordSets, setWordSets] = useState([])
  const [progressData, setProgressData] = useState([])

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

  const ensureProgressRecordsForSet = async (setId, words) => {
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

  const handleSelectWords = async (words, name, setId = DEFAULT_SET_ID) => {
    await ensureProgressRecordsForSet(setId, words)
    setSelectedWords(words)
    setSelectedSetName(name)
    setSelectedSetId(setId)
    setScreen('game')
  }

  const handleAddSet = async (name, words) => {
    const id = await storage.addWordSet(name, words)
    await loadWordSets()
    await ensureProgressRecordsForSet(id, words)
    return id
  }

  const handleProgressUpdate = async (setId, word, correct) => {
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

  const handleDeleteSet = async (id) => {
    if (window.confirm('Видалити цей набір слів?')) {
      await storage.deleteWordSet(id)
      await storage.deleteProgressForSet(id)
      setWordSets((sets) => sets.filter((s) => s.id !== id))
      setProgressData((items) => items.filter((item) => item.setId !== id))
    }
  }

  const handleBack = async () => {
    setScreen('menu')
    await loadWordSets()
    await loadProgressData()
  }

  const handleShowStats = () => {
    setScreen('stats')
  }

  return screen === 'menu' ? (
    <MenuScreen
      onSelectWords={handleSelectWords}
      wordSets={wordSets}
      onDeleteSet={handleDeleteSet}
      onShowStats={handleShowStats}
      onAddSet={handleAddSet}
    />
  ) : screen === 'stats' ? (
    <StatisticsScreen progressData={progressData} onBack={handleBack} />
  ) : (
    <GameScreen
      words={selectedWords}
      setName={selectedSetName}
      setId={selectedSetId}
      onProgressUpdate={handleProgressUpdate}
      onBack={handleBack}
    />
  )
}
