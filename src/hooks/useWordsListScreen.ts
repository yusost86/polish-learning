import { useNavigate } from "react-router-dom";

import { getCatalogTopics } from "../data/wordCatalog";

export interface UseWordsListScreenResult {
  topics: { topicId: string; name: string; wordCount: number }[];
  onBack: () => void;
  onOpenTopic: (topicId: string) => void;
}

export function useWordsListScreen(): UseWordsListScreenResult {
  const navigate = useNavigate();

  return {
    topics: getCatalogTopics(),
    onBack: () => navigate("/"),
    onOpenTopic: (topicId: string) => navigate(`/topic/${topicId}`),
  };
}
