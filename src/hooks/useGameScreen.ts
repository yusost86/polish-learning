import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import type { SessionMode } from "../ui/viewModels/MenuViewModel";
import { parseSessionMode } from "../utils/sessionUtils";
import { useLearningService } from "./useLearningService";

export interface UseGameScreenResult {
  mode?: SessionMode;
  topicId?: string;
  topicsReady: boolean;
  isValidSession: boolean;
  onBack: () => void;
}

export function useGameScreen(): UseGameScreenResult {
  const service = useLearningService();
  const navigate = useNavigate();
  const { topicId } = useParams();
  const [searchParams] = useSearchParams();
  const mode = parseSessionMode(searchParams.get("mode"));
  const [knownTopicIds, setKnownTopicIds] = useState<Set<string>>(new Set());
  const [topicsLoaded, setTopicsLoaded] = useState(false);
  const needsTopicValidation = Boolean(topicId && mode);

  useEffect(() => {
    if (!needsTopicValidation) {
      return;
    }

    let cancelled = false;
    void service.getTopics().then((topics) => {
      if (!cancelled) {
        setKnownTopicIds(new Set(topics.map((topic) => topic.topicId)));
        setTopicsLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [service, needsTopicValidation]);

  const topicsReady = !needsTopicValidation || topicsLoaded;

  const isValidSession = useMemo(() => {
    if (!mode) {
      return false;
    }
    if (topicId && topicsLoaded && !knownTopicIds.has(topicId)) {
      return false;
    }
    return true;
  }, [mode, topicId, topicsLoaded, knownTopicIds]);

  return {
    mode,
    topicId,
    topicsReady,
    isValidSession,
    onBack: () => navigate("/"),
  };
}
