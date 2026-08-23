import { useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { getCatalogTopics } from "../data/wordCatalog";
import type { SessionMode } from "../ui/viewModels/MenuViewModel";
import { parseSessionMode } from "../utils/sessionUtils";

export interface UseGameScreenResult {
  mode?: SessionMode;
  topicId?: string;
  isValidSession: boolean;
  onBack: () => void;
}

export function useGameScreen(): UseGameScreenResult {
  const navigate = useNavigate();
  const { topicId } = useParams();
  const [searchParams] = useSearchParams();
  const mode = parseSessionMode(searchParams.get("mode"));

  const isValidSession = useMemo(() => {
    if (!mode) {
      return false;
    }
    if (topicId) {
      const knownTopicIds = new Set(getCatalogTopics().map((topic) => topic.topicId));
      if (!knownTopicIds.has(topicId)) {
        return false;
      }
    }
    return true;
  }, [mode, topicId]);

  return {
    mode,
    topicId,
    isValidSession,
    onBack: () => navigate("/"),
  };
}
