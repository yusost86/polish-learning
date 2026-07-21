import { Navigate, Route, Routes } from 'react-router-dom'

import { AppDataProvider } from './hooks/useAppData'

import MenuScreen from './screens/MenuScreen'
import GameScreen from './screens/GameScreen'
import StatisticsScreen from './screens/StatisticsScreen'
import WordsListScreen from './screens/WordsListScreen'
import WordDetailScreen from './screens/WordDetailScreen'

export default function App() {
  return (
    <AppDataProvider>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<MenuScreen />} />
          <Route path="/game" element={<GameScreen />} />
          <Route path="/stats" element={<StatisticsScreen />} />
          <Route path="/words" element={<WordsListScreen />} />
          <Route path="/word/:wordId" element={<WordDetailScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AppDataProvider>
  )
}
