import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CATALOG_WORDS, DEFAULT_STUDENT_ID } from "../data/wordCatalog";
import type { Word } from "../domain/models/Word";
import type { ExerciseTask } from "../domain/models/ExerciseTask";
import type { LearningQueueItem } from "../domain/models/LearningQueueItem";
import { isChoiceExerciseTask, isTypedExerciseTask } from "../domain/models/ExerciseTask";
import { buildTaskFromQueueItem } from "../services/exerciseTaskBuilder";
import { initLearningEngine } from "../services/learningEngineProvider";
import { gradeForeignTermAnswer } from "../services/mock/ContextExerciseBuilder";
import {
  getCorrectChoiceLabel,
  gradeChoiceExercise,
} from "../services/mock/MultipleChoiceExerciseBuilder";
import type { SessionPhase } from "../ui/viewModels/GameTaskViewModel";
import type { SessionMode } from "../domain/enums/SessionMode";
import { sessionModeLabel } from "../utils/sessionUtils";

export interface UseExerciseSessionParams {
  mode?: SessionMode;
  topicId?: string;
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
  onBack,
}: UseExerciseSessionParams): UseExerciseSessionResult {
  const [queue, setQueue] = useState<LearningQueueItem[]>([]);
  const [taskIndex, setTaskIndex] = useState(0);
  const [phase, setPhase] = useState<SessionPhase>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctAnswerLabel, setCorrectAnswerLabel] = useState("");
  const answerStartedAtRef = useRef(Date.now());

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      if (!mode) {
        setQueue([]);
        setLoadError(null);
        setPhase("complete");
        return;
      }

      setPhase("loading");
      setLoadError(null);
      try {
        const engine = await initLearningEngine();
        const tasks = await engine.getNextTasks(DEFAULT_STUDENT_ID, { topicId, mode });

        if (cancelled) {
          return;
        }

        setQueue(tasks);
        setTaskIndex(0);
        setPhase(tasks.length > 0 ? "exercise" : "complete");
        answerStartedAtRef.current = Date.now();
      } catch (err) {
        if (!cancelled) {
          setQueue([]);
          setLoadError(err instanceof Error ? err.message : "Не вдалося завантажити сесію");
          setPhase("error");
        }
      }
    }

    void loadSession();
    return () => {
      cancelled = true;
    };
  }, [mode, topicId, retryCount]);

  const currentItem = queue[taskIndex] ?? null;
  const wordPool = useMemo<Word[]>(() => CATALOG_WORDS, []);

  const task = useMemo(() => {
    if (!currentItem) {
      return null;
    }
    return buildTaskFromQueueItem(currentItem, wordPool);
  }, [currentItem, wordPool]);

  useEffect(() => {
    if (phase === "exercise") {
      answerStartedAtRef.current = Date.now();
    }
  }, [phase, taskIndex, task]);

  const persistAnswer = useCallback(
    async (correct: boolean) => {
      if (!currentItem) {
        return;
      }
      const engine = await initLearningEngine();
      await engine.submitAnswer({
        studentId: DEFAULT_STUDENT_ID,
        wordId: currentItem.word.id,
        exerciseType: currentItem.exercise,
        correct,
        responseTimeMs: Date.now() - answerStartedAtRef.current,
      });
    },
    [currentItem],
  );

  const onSelectAnswer = useCallback(
    (choiceId: string) => {
      if (phase !== "exercise" || !task || !isChoiceExerciseTask(task)) {
        return;
      }
      const correct = gradeChoiceExercise(task, choiceId);
      setSelectedChoiceId(choiceId);
      setIsCorrect(correct);
      setCorrectAnswerLabel(getCorrectChoiceLabel(task));
      setPhase("feedback");
      void persistAnswer(correct);
    },
    [phase, task, persistAnswer],
  );

  const onSubmitTypedAnswer = useCallback(() => {
    if (phase !== "exercise" || !task || !isTypedExerciseTask(task) || !typedAnswer.trim()) {
      return;
    }
    const correct = gradeForeignTermAnswer(task.expectedTerm, typedAnswer);
    setIsCorrect(correct);
    setCorrectAnswerLabel(task.expectedTerm);
    setPhase("feedback");
    void persistAnswer(correct);
  }, [phase, task, typedAnswer, persistAnswer]);

  const onContinue = useCallback(() => {
    if (phase !== "feedback") {
      return;
    }

    const nextIndex = taskIndex + 1;
    if (nextIndex >= queue.length) {
      setPhase("complete");
      return;
    }

    setTaskIndex(nextIndex);
    resetAnswerState(setSelectedChoiceId, setTypedAnswer, setIsCorrect, setCorrectAnswerLabel);
    setPhase("exercise");
  }, [phase, taskIndex, queue.length]);

  const onRetry = useCallback(() => {
    setRetryCount((count) => count + 1);
  }, []);

  return {
    phase,
    task,
    progress: {
      current: queue.length === 0 ? 0 : taskIndex + 1,
      total: queue.length,
    },
    selectedChoiceId,
    typedAnswer,
    isCorrect,
    correctAnswerLabel,
    modeLabel: sessionModeLabel(mode),
    loadError,
    onSelectAnswer,
    onTypedAnswerChange: setTypedAnswer,
    onSubmitTypedAnswer,
    onContinue,
    onRetry,
    onBack,
  };
}
