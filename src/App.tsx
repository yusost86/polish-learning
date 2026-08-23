import { Navigate, Route, Routes } from "react-router-dom";

import GameScreen from "./screens/GameScreen";
import MenuScreen from "./screens/MenuScreen";
import StatisticsScreen from "./screens/StatisticsScreen";
import TopicOverviewScreen from "./screens/TopicOverviewScreen";
import WordsListScreen from "./screens/WordsListScreen";

export default function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<MenuScreen />} />
        <Route path="/game/:topicId" element={<GameScreen />} />
        <Route path="/game" element={<GameScreen />} />
        <Route path="/stats" element={<StatisticsScreen />} />
        <Route path="/words" element={<WordsListScreen />} />
        <Route path="/topic/:topicId" element={<TopicOverviewScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
