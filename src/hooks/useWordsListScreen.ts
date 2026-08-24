import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { DEFAULT_STUDENT_ID, getCatalogTopics } from "../data/wordCatalog";
import { initLearningEngine } from "../services/learningEngineProvider";

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

export interface WordsListTopic {
  topicId: string;
  name: string;
  wordCount: number;
}

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
  const navigate = useNavigate();
  const [topics, setTopics] = useState(getCatalogTopics());
  const [importText, setImportText] = useState("");
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [deletingTopicId, setDeletingTopicId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const refreshTopics = useCallback(() => {
    setTopics(getCatalogTopics());
  }, []);

  useEffect(() => {
    void initLearningEngine().then(() => refreshTopics());
  }, [refreshTopics]);

  const onImportWords = useCallback(async () => {
    setImporting(true);
    setImportMessage(null);
    setImportError(null);
    try {
      const engine = await initLearningEngine();
      const result = await engine.importWords(importText);
      refreshTopics();

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
  }, [importText, refreshTopics]);

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
        const engine = await initLearningEngine();
        const result = await engine.deleteTopic(DEFAULT_STUDENT_ID, topic.topicId);
        refreshTopics();
        setDeleteMessage(`Тему «${topic.name}» видалено (${result.deletedWordCount} слів)`);
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : "Не вдалося видалити тему");
      } finally {
        setDeletingTopicId(null);
      }
    },
    [refreshTopics],
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
