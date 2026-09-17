import { useNavigate } from "react-router-dom";

import type { MenuSummary, TopicPrimaryAction, TopicStatViewModel } from "../ui/viewModels/MenuViewModel";
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
  onTopicPrimaryAction: (topicId: string, action: TopicPrimaryAction) => void;
  onOpenTopic: (topicId: string) => void;
  onOpenStats: () => void;
  onOpenWords: () => void;
  onOpenSettings: () => void;
  onRefresh: () => void;
}

export function useMenuScreen(): UseMenuScreenResult {
  const navigate = useNavigate();
  const { summary, topicStats, loading, error, refresh } = useMenuStats();
  const { devMode } = useAppSettings();

  return {
    summary,
    topicStats,
    loading,
    error,
    appVersion: import.meta.env.VITE_APP_VERSION || "0.1.0",
    devMode,
    onRepeatDue: () => navigate("/game?mode=due"),
    onTopicPrimaryAction: (topicId, action) =>
      navigate(`/game/${topicId}?mode=${action === "learn" ? "new" : "due"}`),
    onOpenTopic: (topicId: string) => navigate(`/topic/${topicId}`),
    onOpenStats: () => navigate("/stats"),
    onOpenWords: () => navigate("/words"),
    onOpenSettings: () => navigate("/settings"),
    onRefresh: refresh,
  };
}

export { getTopicName } from "../data/wordCatalog";
