import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { toTopicOverviewViewModel } from "../ui/viewModels/topicOverviewMapper";
import type { TopicOverviewViewModel } from "../ui/viewModels/TopicOverviewViewModel";
import { useLearningService } from "./useLearningService";

export interface UseTopicOverviewResult {
  topicId: string;
  overview: TopicOverviewViewModel | null;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onRefresh: () => void;
  onStartSession: () => void;
}

export function useTopicOverview(): UseTopicOverviewResult {
  const service = useLearningService();
  const navigate = useNavigate();
  const { topicId = "" } = useParams();
  const [overview, setOverview] = useState<TopicOverviewViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!topicId) {
      setError("Тему не знайдено");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await service.getTopicOverview(topicId);
      setOverview(toTopicOverviewViewModel(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося завантажити тему");
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, [topicId, service]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    topicId,
    overview,
    loading,
    error,
    onBack: () => navigate("/"),
    onRefresh: () => void load(),
    onStartSession: () => navigate(`/game/${topicId}?mode=new`),
  };
}
