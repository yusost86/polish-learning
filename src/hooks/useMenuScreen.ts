import { useNavigate } from "react-router-dom";

import { useMenuStats } from "./useMenuStats";
import type { MenuSummary, TopicStatViewModel } from "../ui/viewModels/MenuViewModel";

export interface UseMenuScreenResult {
  summary: MenuSummary;
  topicStats: TopicStatViewModel[];
  loading: boolean;
  error: string | null;
  appVersion: string;
  onRepeatDue: () => void;
  onLearnTopic: (topicId: string) => void;
  onReviewTopic: (topicId: string) => void;
  onOpenTopic: (topicId: string) => void;
  onOpenStats: () => void;
  onOpenWords: () => void;
  onRefresh: () => void;
}

export function useMenuScreen(): UseMenuScreenResult {
  const navigate = useNavigate();
  const { summary, topicStats, loading, error, refresh } = useMenuStats();

  return {
    summary,
    topicStats,
    loading,
    error,
    appVersion: import.meta.env.VITE_APP_VERSION || "0.1.0",
    onRepeatDue: () => navigate("/game?mode=due"),
    onLearnTopic: (topicId: string) => navigate(`/game/${topicId}?mode=new`),
    onReviewTopic: (topicId: string) => navigate(`/game/${topicId}?mode=due`),
    onOpenTopic: (topicId: string) => navigate(`/topic/${topicId}`),
    onOpenStats: () => navigate("/stats"),
    onOpenWords: () => navigate("/words"),
    onRefresh: refresh,
  };
}

export { getTopicName } from "../data/wordCatalog";
