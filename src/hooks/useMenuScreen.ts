import { useNavigate } from "react-router-dom";

import type { MenuSummary, TopicStatViewModel } from "../ui/viewModels/MenuViewModel";
import { useAppSettings } from "./useAppSettings";
import { useMenuStats } from "./useMenuStats";

export interface UseMenuScreenResult {
  summary: MenuSummary;
  topicStats: TopicStatViewModel[];
  loading: boolean;
  error: string | null;
  appVersion: string;
  devMode: boolean;
  onRepeatDue: () => void;
  onOpenTopic: (topicId: string) => void;
  onOpenStats: () => void;
  onOpenWords: () => void;
  onOpenSettings: () => void;
}

export function useMenuScreen(): UseMenuScreenResult {
  const navigate = useNavigate();
  const { summary, topicStats, loading, error } = useMenuStats();
  const { devMode } = useAppSettings();

  return {
    summary,
    topicStats,
    loading,
    error,
    appVersion: import.meta.env.VITE_APP_VERSION || "0.1.0",
    devMode,
    onRepeatDue: () => navigate("/game?mode=due"),
    onOpenTopic: (topicId: string) => navigate(`/topic/${topicId}`),
    onOpenStats: () => navigate("/stats"),
    onOpenWords: () => navigate("/words"),
    onOpenSettings: () => navigate("/settings")
  };
}

export { getTopicName } from "../data/wordCatalog";
