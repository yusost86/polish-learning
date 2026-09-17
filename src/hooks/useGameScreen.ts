import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getCatalogTopics } from "../data/wordCatalog";

export interface UseGameScreenResult {
  topicId?: string;
  isValidSession: boolean;
  onBack: () => void;
}

export function useGameScreen(): UseGameScreenResult {
  const navigate = useNavigate();
  const { topicId } = useParams();

  const isValidSession = useMemo(() => {
    if (topicId) {
      const knownTopicIds = new Set(getCatalogTopics().map((topic) => topic.topicId));
      if (!knownTopicIds.has(topicId)) {
        return false;
      }
    }
    return true;
  }, [topicId]);

  return {
    topicId,
    isValidSession,
    onBack: () => navigate("/"),
  };
}
