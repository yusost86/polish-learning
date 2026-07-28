// src/hooks/useAppData.tsx

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { db, LOCAL_STUDENT_ID } from "../db/db";
import { loadProgressRecords, computeGlobalSummary } from "../learning/progress";

import type { GlobalProgressSummary, Topic, WordProgressRecord } from "../domain/types";

interface AppDataValue {
  topics: Topic[];
  progressRecords: WordProgressRecord[];
  summary: GlobalProgressSummary;
  loading: boolean;
  reloadTopics: () => Promise<void>;
  reloadProgress: () => Promise<void>;
  reloadAll: () => Promise<void>;
}

const AppDataContext = createContext<AppDataValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [progressRecords, setProgressRecords] = useState<WordProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const reloadTopics = useCallback(async () => {
    const t = await db.topics.toArray();
    setTopics(t.sort((a, b) => a.name.localeCompare(b.name, "uk")));
  }, []);

  const reloadProgress = useCallback(async () => {
    const records = await loadProgressRecords(LOCAL_STUDENT_ID);
    setProgressRecords(records);
  }, []);

  const reloadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([reloadTopics(), reloadProgress()]);
    setLoading(false);
  }, [reloadTopics, reloadProgress]);

  useEffect(() => {
    const tt = async () => { await reloadAll() };

    tt();
  }, [reloadAll]);

  const summary = useMemo(() => computeGlobalSummary(progressRecords), [progressRecords]);

  const value: AppDataValue = {
    topics,
    progressRecords,
    summary,
    loading,
    reloadTopics,
    reloadProgress,
    reloadAll,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
