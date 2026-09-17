import { useCallback, useEffect, useReducer, useRef } from "react";

import { initLearningEngine } from "../services/learningEngineProvider";
import type { SessionPhase } from "../ui/viewModels/GameTaskViewModel";
import { sessionModeLabel, type SessionMode } from "../utils/sessionUtils";
import { ExerciseModel, LessonModel } from "../domain/models/LessonModel";

export interface UseExerciseSessionParams {
  mode?: SessionMode;
  topicId?: string;
  onBack: () => void;
}

export interface UseExerciseSessionResult {
  phase: SessionPhase;
  exercise: ExerciseModel | null;
  progress: { current: number; total: number };
  modeLabel: string;
  loadError: string | null;
  onContinue: (correct: boolean) => void;
  onRetry: () => void;
  onBack: () => void;
}

interface ExerciseSessionState {
  queue: ExerciseModel[];
  phase: SessionPhase;
  loadError: string | null;
  currentTask: ExerciseModel | null;
  total: number;
}

type ExerciseSessionAction =
  | { type: "sessionCleared" }
  | { type: "loadStarted" }
  | { type: "loadSucceeded"; queue: ExerciseModel[] }
  | { type: "loadFailed"; message: string }
  | { type: "continued" }
  | { type: "retried" };

function createInitialState(): ExerciseSessionState {
  return {
    queue: [],
    phase: "loading",
    loadError: null,
    currentTask: null,
    total: 0,
  };
}

function exerciseSessionReducer(
  state: ExerciseSessionState,
  action: ExerciseSessionAction,
): ExerciseSessionState {
  switch (action.type) {
    case "sessionCleared":
      return {
        ...state,
        queue: [],
        loadError: null,
        currentTask: null,
        total: 0,
        phase: "complete",
      };
    case "loadStarted":
      return {
        ...state,
        phase: "loading",
        loadError: null,
      };
    case "loadSucceeded": {
      const [first, ...rest] = action.queue;
      return {
        ...state,
        queue: rest,
        currentTask: first ?? null,
        total: action.queue.length,
        phase: action.queue.length > 0 ? "exercise" : "complete",
      };
    }
    case "loadFailed":
      return {
        ...state,
        queue: [],
        currentTask: null,
        total: 0,
        loadError: action.message,
        phase: "error",
      };
    case "continued": {
      if (state.phase !== "exercise") {
        return state;
      }

      if (!state.queue.length) {
        return {
          ...state,
          currentTask: null,
          phase: "complete",
        };
      }

      return {
        ...state,
        currentTask: state.queue[0],
        queue: state.queue.slice(1),
        phase: "exercise",
      };
    }
    case "retried":
      return {
        ...state,
      };
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

export function useExerciseSession({
  mode,
  topicId,
  onBack,
}: UseExerciseSessionParams): UseExerciseSessionResult {
  const [state, dispatch] = useReducer(exerciseSessionReducer, undefined, createInitialState);
  const { queue, phase, loadError, currentTask, total } = state;
  const answerStartedAtRef = useRef(Date.now());
  const lessonRef = useRef<LessonModel | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      dispatch({ type: "loadStarted" });
      try {
        const engine = await initLearningEngine();
        const lesson = await engine.getLesson({ topicId });

        if (cancelled) {
          return;
        }

        lessonRef.current = lesson;
        dispatch({ type: "loadSucceeded", queue: lesson.GetExercises() });
        answerStartedAtRef.current = Date.now();
      } catch (err) {
        if (!cancelled) {
          dispatch({
            type: "loadFailed",
            message: err instanceof Error ? err.message : "Не вдалося завантажити сесію",
          });
        }
      }
    }

    void loadSession();
    return () => {
      cancelled = true;
    };
  }, [topicId]);

  const exercise = currentTask;

  useEffect(() => {
    if (phase === "exercise") {
      answerStartedAtRef.current = Date.now();
    }
  }, [phase, exercise]);

  const persistAnswer = useCallback(
    async (_correct: boolean) => {
      if (!exercise) {
        return;
      }
      const engine = await initLearningEngine();
      await engine.submitAnswer(exercise.LearningWord);
    },
    [exercise],
  );

  const onContinue = useCallback(
    (correct: boolean) => {
      void persistAnswer(correct).then(() => {
        dispatch({ type: "continued" });
      });
    },
    [persistAnswer],
  );

  const onRetry = useCallback(() => {
    dispatch({ type: "retried" });
  }, []);

  return {
    phase,
    exercise,
    progress: {
      current: total === 0 ? 0 : total - queue.length,
      total,
    },
    modeLabel: sessionModeLabel(mode),
    loadError,
    onContinue,
    onRetry,
    onBack,
  };
}
