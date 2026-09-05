import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { TopicListItem } from "../application/types/catalog";
import { useLearningService } from "./useLearningService";

const EXAMPLE_JSON = `[
  {
    "topic": "health",
    "words": { "pl": "lekarz", "ua": "лікар" }
  },
  {
    "topic": "health",
    "words": [
      { "pl": "apteka", "ua": "аптека" },
      { "pl": "lekarz", "ua": "лікар" }
    ]
  }
]`;

export type WordsListTopic = TopicListItem;

export interface UseWordsListScreenResult {
  topics: WordsListTopic[];
  importText: string;
  importMessage: string | null;
  importError: string | null;
  importing: boolean;
  deletingTopicId: string | null;
  deleteMessage: string | null;
  deleteError: string | null;
  onBack: () => void;
  onOpenTopic: (topicId: string) => void;
  onDeleteTopic: (topic: WordsListTopic) => void;
  onImportTextChange: (value: string) => void;
  onImportWords: () => void;
  onUseExample: () => void;
}

export function useWordsListScreen(): UseWordsListScreenResult {
  const service = useLearningService();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<WordsListTopic[]>([]);
  const [importText, setImportText] = useState("");
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [deletingTopicId, setDeletingTopicId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const refreshTopics = useCallback(async () => {
    const nextTopics = await service.getTopics();
    setTopics(nextTopics);
  }, [service]);

  useEffect(() => {
    void refreshTopics();
  }, [refreshTopics]);

  const onImportWords = useCallback(async () => {
    setImporting(true);
    setImportMessage(null);
    setImportError(null);
    try {
      const result = await service.importWords(importText);
      await refreshTopics();

      if (result.errors.length > 0 && result.added === 0) {
        setImportError(result.errors.join("\n"));
        return;
      }

      if (result.added === 0 && result.skippedDuplicates === 0 && result.errors.length === 0) {
        setImportError("Немає слів для імпорту");
        return;
      }

      const parts = [`Додано ${result.added} слів`];
      if (result.skippedDuplicates > 0) {
        parts.push(`пропущено дублікатів: ${result.skippedDuplicates}`);
      }
      setImportMessage(parts.join(", "));
      if (result.errors.length > 0) {
        setImportError(result.errors.join("\n"));
      }
      if (result.added > 0) {
        setImportText("");
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Не вдалося імпортувати слова");
    } finally {
      setImporting(false);
    }
  }, [importText, refreshTopics, service]);

  const onDeleteTopic = useCallback(
    async (topic: WordsListTopic) => {
      const confirmed = window.confirm(
        `Видалити тему «${topic.name}» (${topic.wordCount} слів)? Уся статистика прогресу буде втрачена.`,
      );
      if (!confirmed) {
        return;
      }

      setDeletingTopicId(topic.topicId);
      setDeleteMessage(null);
      setDeleteError(null);
      try {
        const result = await service.deleteTopic(topic.topicId);
        await refreshTopics();
        setDeleteMessage(`Тему «${topic.name}» видалено (${result.deletedWordCount} слів)`);
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : "Не вдалося видалити тему");
      } finally {
        setDeletingTopicId(null);
      }
    },
    [refreshTopics, service],
  );

  return {
    topics,
    importText,
    importMessage,
    importError,
    importing,
    deletingTopicId,
    deleteMessage,
    deleteError,
    onBack: () => navigate("/"),
    onOpenTopic: (topicId: string) => navigate(`/topic/${topicId}`),
    onDeleteTopic,
    onImportTextChange: setImportText,
    onImportWords,
    onUseExample: () => setImportText(EXAMPLE_JSON),
  };
}
