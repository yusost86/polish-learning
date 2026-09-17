import type { SessionPhase } from "../../ui/viewModels/GameTaskViewModel";
import { BackButton } from "../components/BackButton";
import { ActiveExercise } from "./exercises/ActiveExercise";
import { ExerciseModel } from "../../domain/models/LessonModel";

interface GameSessionViewProps {
  phase: SessionPhase;
  exercise: ExerciseModel | null;
  progress: { current: number; total: number };
  modeLabel: string;
  onBack: () => void;
  onContinue: (correct: boolean) => void;
  onRetry?: () => void;
  loadError?: string | null;
  devMode?: boolean;
  topicLabel: string;
}

export function GameSessionView({
  phase,
  exercise,
  progress,
  modeLabel,
  topicLabel,
  onBack,
  onContinue,
  onRetry,
  loadError,
  devMode = false,
}: GameSessionViewProps) {

  if (phase === "loading") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <BackButton onClick={onBack} />
        <h1 style={{ fontSize: 24 }}>Завантаження сесії…</h1>
        <p style={{ margin: 0, color: "var(--text-dim)", fontSize: 15, lineHeight: 1.5 }}>
          {modeLabel}
          {topicLabel}
        </p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <BackButton onClick={onBack} />
        <h1 style={{ fontSize: 24 }}>Помилка завантаження</h1>
        <p style={{ margin: 0, color: "var(--text-dim)", fontSize: 15, lineHeight: 1.5 }}>
          {loadError ?? "Не вдалося завантажити сесію."}
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                padding: "13px 16px",
                borderRadius: "var(--radius-s)",
                background: "var(--gold)",
                color: "#2a1e0c",
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              Спробувати знову
            </button>
          )}
          <button
            onClick={onBack}
            style={{
              padding: "13px 16px",
              borderRadius: "var(--radius-s)",
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text)",
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            На головну
          </button>
        </div>
      </div>
    );
  }

  if (phase === "complete") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <BackButton onClick={onBack} />
        <h1 style={{ fontSize: 24 }}>Сесію завершено</h1>
        <p style={{ margin: 0, color: "var(--text-dim)", fontSize: 15, lineHeight: 1.5 }}>
          {progress.total} {progress.total === 1 ? "вправа" : progress.total < 5 ? "вправи" : "вправ"} · {modeLabel}
          {topicLabel}
        </p>
        <button
          onClick={onBack}
          style={{
            padding: "13px 16px",
            borderRadius: "var(--radius-s)",
            background: "var(--gold)",
            color: "#2a1e0c",
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          На головну
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <BackButton onClick={onBack} />
        <div className="mono" style={{ fontSize: 13, color: "var(--text-faint)" }}>
          {progress.current} / {progress.total}
        </div>
      </div>

      <div style={{ fontSize: 13, color: "var(--gold)", fontWeight: 600 }}>
        {modeLabel}
        {topicLabel}
      </div>

      {exercise && (
        <ActiveExercise
          key={`${progress.current}-${exercise.word.id}-${exercise.exerciseType}`}
          exercise={exercise}
          devMode={devMode}
          onContinue={onContinue}
        />
      )}
    </div>
  );
}
