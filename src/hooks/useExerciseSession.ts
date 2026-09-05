import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ExerciseTask } from "../domain/models/ExerciseTask";
import { isChoiceExerciseTask, isTypedExerciseTask } from "../domain/models/ExerciseTask";
import type { SessionPhase } from "../ui/viewModels/GameTaskViewModel";
import type { SessionMode } from "../domain/enums/SessionMode";
import { useLearningService } from "./useLearningService";

export interface UseExerciseSessionParams {
  mode?: SessionMode;
  topicId?: string;
  enabled?: boolean;
  onBack: () => void;
}

export interface UseExerciseSessionResult {
  phase: SessionPhase;
  task: ExerciseTask | null;
  progress: { current: number; total: number };
  selectedChoiceId: string | null;
  typedAnswer: string;
  isCorrect: boolean | null;
  correctAnswerLabel: string;
  modeLabel: string;
  topicName: string;
  loadError: string | null;
  onSelectAnswer: (choiceId: string) => void;
  onTypedAnswerChange: (value: string) => void;
  onSubmitTypedAnswer: () => void;
  onContinue: () => void;
  onRetry: () => void;
  onBack: () => void;
}

function resetAnswerState(
  setSelectedChoiceId: (value: string | null) => void,
  setTypedAnswer: (value: string) => void,
  setIsCorrect: (value: boolean | null) => void,
  setCorrectAnswerLabel: (value: string) => void,
): void {
  setSelectedChoiceId(null);
  setTypedAnswer("");
  setIsCorrect(null);
  setCorrectAnswerLabel("");
}

export function useExerciseSession({
  mode,
  topicId,
  enabled = true,
  onBack,
}: UseExerciseSessionParams): UseExerciseSessionResult {
  const service = useLearningService();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<ExerciseTask[]>([]);
  const [taskIndex, setTaskIndex] = useState(0);
  const [phase, setPhase] = useState<SessionPhase>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctAnswerLabel, setCorrectAnswerLabel] = useState("");
  const [modeLabel, setModeLabel] = useState("");
  const [topicName, setTopicName] = useState("");
  const answerStartedAtRef = useRef(Date.now());
  const sessionGenerationRef = useRef(0);
  const activeSessionIdRef = useRef<string | null>(null);

  const endActiveSession = useCallback(
    (id: string | null) => {
      if (id) {
        service.endSession(id);
      }
    },
    [service],
  );

  useEffect(() => {
    let cancelled = false;
    const generation = sessionGenerationRef.current + 1;
    sessionGenerationRef.current = generation;

    async function loadSession() {
      if (!enabled) {
        endActiveSession(activeSessionIdRef.current);
        activeSessionIdRef.current = null;
        setSessionId(null);
        setTasks([]);
        return;
      }

      if (!mode) {
        endActiveSession(activeSessionIdRef.current);
        activeSessionIdRef.current = null;
        setSessionId(null);
        setTasks([]);
        setLoadError(null);
        setPhase("complete");
        return;
      }

      endActiveSession(activeSessionIdRef.current);
      activeSessionIdRef.current = null;

      setPhase("loading");
      setLoadError(null);
      resetAnswerState(setSelectedChoiceId, setTypedAnswer, setIsCorrect, setCorrectAnswerLabel);

      try {
        const result = await service.startSession({ mode, topicId });

        if (cancelled || sessionGenerationRef.current !== generation) {
          service.endSession(result.sessionId);
          return;
        }

        activeSessionIdRef.current = result.sessionId;
        setSessionId(result.sessionId);
        setTasks(result.tasks);
        setModeLabel(result.modeLabel);
        setTopicName(result.topicName);
        setTaskIndex(0);
        setPhase(result.tasks.length > 0 ? "exercise" : "complete");
        answerStartedAtRef.current = Date.now();
      } catch (err) {
        if (!cancelled && sessionGenerationRef.current === generation) {
          setSessionId(null);
          setTasks([]);
          setLoadError(err instanceof Error ? err.message : "Не вдалося завантажити сесію");
          setPhase("error");
        }
      }
    }

    void loadSession();
    return () => {
      cancelled = true;
      if (sessionGenerationRef.current === generation) {
        endActiveSession(activeSessionIdRef.current);
        activeSessionIdRef.current = null;
      }
    };
  }, [mode, topicId, retryCount, service, enabled, endActiveSession]);

  const task = useMemo(() => tasks[taskIndex] ?? null, [tasks, taskIndex]);

  useEffect(() => {
    if (phase === "exercise") {
      answerStartedAtRef.current = Date.now();
    }
  }, [phase, taskIndex, task]);

  const submitCurrentAnswer = useCallback(
    async (answer: { type: "choice"; choiceId: string } | { type: "typed"; text: string }) => {
      if (!sessionId || phase !== "exercise" || !task) {
        return;
      }

      const generation = sessionGenerationRef.current;
      setPhase("submitting");

      try {
        const result = await service.submitAnswer({
          sessionId,
          taskIndex,
          answer,
          responseTimeMs: Date.now() - answerStartedAtRef.current,
        });

        if (sessionGenerationRef.current !== generation) {
          return;
        }

        setIsCorrect(result.isCorrect);
        setCorrectAnswerLabel(result.correctAnswerLabel);
        setPhase("feedback");
      } catch (err) {
        if (sessionGenerationRef.current !== generation) {
          return;
        }
        setLoadError(err instanceof Error ? err.message : "Не вдалося зберегти відповідь");
        setPhase("error");
      }
    },
    [sessionId, phase, task, taskIndex, service],
  );

  const onSelectAnswer = useCallback(
    (choiceId: string) => {
      if (phase !== "exercise" || !task || !isChoiceExerciseTask(task) || !sessionId) {
        return;
      }
      setSelectedChoiceId(choiceId);
      void submitCurrentAnswer({ type: "choice", choiceId });
    },
    [phase, task, sessionId, submitCurrentAnswer],
  );

  const onSubmitTypedAnswer = useCallback(() => {
    if (
      phase !== "exercise" ||
      !task ||
      !isTypedExerciseTask(task) ||
      !typedAnswer.trim() ||
      !sessionId
    ) {
      return;
    }
    void submitCurrentAnswer({ type: "typed", text: typedAnswer });
  }, [phase, task, typedAnswer, sessionId, submitCurrentAnswer]);

  const onContinue = useCallback(() => {
    if (phase !== "feedback") {
      return;
    }

    const nextIndex = taskIndex + 1;
    if (nextIndex >= tasks.length) {
      endActiveSession(activeSessionIdRef.current);
      activeSessionIdRef.current = null;
      setSessionId(null);
      setPhase("complete");
      return;
    }

    setTaskIndex(nextIndex);
    resetAnswerState(setSelectedChoiceId, setTypedAnswer, setIsCorrect, setCorrectAnswerLabel);
    setPhase("exercise");
  }, [phase, taskIndex, tasks.length, endActiveSession]);

  const onRetry = useCallback(() => {
    setRetryCount((count) => count + 1);
  }, []);

  return {
    phase,
    task,
    progress: {
      current: tasks.length === 0 ? 0 : taskIndex + 1,
      total: tasks.length,
    },
    selectedChoiceId,
    typedAnswer,
    isCorrect,
    correctAnswerLabel,
    modeLabel,
    topicName,
    loadError,
    onSelectAnswer,
    onTypedAnswerChange: setTypedAnswer,
    onSubmitTypedAnswer,
    onContinue,
    onRetry,
    onBack,
  };
}
