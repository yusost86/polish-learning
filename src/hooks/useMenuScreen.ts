import { useNavigate } from "react-router-dom";

import { getCatalogTopics, getTopicName } from "../data/wordCatalog";
import type { MenuSummary, TopicStatViewModel } from "../ui/viewModels/MenuViewModel";

export const HARDCODED_MENU_SUMMARY: MenuSummary = {
  totalUniqueWords: 120,
  newWordsCount: 40,
  learnedWordsCount: 65,
  dueNowCount: 8,
};

function buildTopicStats(): TopicStatViewModel[] {
  return getCatalogTopics().map(({ topicId, name, wordCount }) => ({
    topicId,
    name,
    total: wordCount,
    learned: 0,
    due: 0,
    new: wordCount,
  }));
}

export interface UseMenuScreenResult {
  summary: MenuSummary;
  topicStats: TopicStatViewModel[];
  appVersion: string;
  onRepeatDue: () => void;
  onLearnTopic: (topicId: string) => void;
  onReviewTopic: (topicId: string) => void;
  onOpenTopic: (topicId: string) => void;
  onOpenStats: () => void;
  onOpenWords: () => void;
}

export function useMenuScreen(): UseMenuScreenResult {
  const navigate = useNavigate();

  return {
    summary: HARDCODED_MENU_SUMMARY,
    topicStats: buildTopicStats(),
    appVersion: import.meta.env.VITE_APP_VERSION || "0.1.0",
    onRepeatDue: () => navigate("/game?mode=due"),
    onLearnTopic: (topicId: string) => navigate(`/game/${topicId}?mode=new`),
    onReviewTopic: (topicId: string) => navigate(`/game/${topicId}?mode=due`),
    onOpenTopic: (topicId: string) => navigate(`/topic/${topicId}`),
    onOpenStats: () => navigate("/stats"),
    onOpenWords: () => navigate("/words"),
  };
}

export { getTopicName };
