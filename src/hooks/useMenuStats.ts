import { useCallback, useEffect, useState } from "react";

import { DEFAULT_STUDENT_ID } from "../data/wordCatalog";
import { initLearningEngine } from "../services/learningEngineProvider";
import { toMenuSummary, toTopicStatViewModels } from "../ui/viewModels/menuStatsMapper";
import type { MenuSummary, TopicStatViewModel } from "../ui/viewModels/MenuViewModel";

const EMPTY_SUMMARY: MenuSummary = {
  totalUniqueWords: 0,
  newWordsCount: 0,
  learnedWordsCount: 0,
  dueNowCount: 0,
};

export interface UseMenuStatsResult {
  summary: MenuSummary;
  topicStats: TopicStatViewModel[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useMenuStats(): UseMenuStatsResult {
  const [summary, setSummary] = useState<MenuSummary>(EMPTY_SUMMARY);
  const [topicStats, setTopicStats] = useState<TopicStatViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const engine = await initLearningEngine();
      const stats = await engine.getMenuStats(DEFAULT_STUDENT_ID);
      setSummary(toMenuSummary(stats));
      setTopicStats(toTopicStatViewModels(stats));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося завантажити статистику");
      setSummary(EMPTY_SUMMARY);
      setTopicStats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    summary,
    topicStats,
    loading,
    error,
    refresh: () => void load(),
  };
}
