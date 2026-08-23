import type { ExerciseTask } from "../../domain/models/ExerciseTask";
import {
  isChoiceExerciseTask,
  isContextExerciseTask,
  isProductionExerciseTask,
} from "../../domain/models/ExerciseTask";
import type { SessionPhase } from "../../ui/viewModels/GameTaskViewModel";
import { exercisePromptLabel, exerciseTypeTitle } from "../../utils/exerciseUtils";
import { AnswerFeedback } from "./AnswerFeedback";
import { BackButton } from "./BackButton";
import { MultipleChoiceExerciseView } from "./MultipleChoiceExerciseView";
import { PromptCard } from "./PromptCard";
import { TypeInExerciseView } from "./TypeInExerciseView";

interface GameSessionViewProps {
  phase: SessionPhase;
  task: ExerciseTask | null;
  progress: { current: number; total: number };
  modeLabel: string;
  topicId?: string;
  selectedChoiceId: string | null;
  typedAnswer: string;
  isCorrect: boolean | null;
  correctAnswerLabel: string;
  onBack: () => void;
  onSelectAnswer: (choiceId: string) => void;
  onTypedAnswerChange: (value: string) => void;
  onSubmitTypedAnswer: () => void;
  onContinue: () => void;
  onRetry?: () => void;
  loadError?: string | null;
}

export function GameSessionView({
  phase,
  task,
  progress,
  modeLabel,
  topicId,
  selectedChoiceId,
  typedAnswer,
  isCorrect,
  correctAnswerLabel,
  onBack,
  onSelectAnswer,
  onTypedAnswerChange,
  onSubmitTypedAnswer,
  onContinue,
  onRetry,
  loadError,
}: GameSessionViewProps) {
  const topicLabel = topicId ? ` · ${topicId}` : "";

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

  const exerciseTitle = task ? exerciseTypeTitle(task.exerciseType) : "Вправа";
  const promptLabel = task ? exercisePromptLabel(task.exerciseType) : "Оберіть відповідь";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <BackButton onClick={onBack} />
        <div className="mono" style={{ fontSize: 13, color: "var(--text-faint)" }}>
          {progress.current} / {progress.total}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 13, color: "var(--gold)", fontWeight: 600, marginBottom: 4 }}>
          {modeLabel}
          {topicLabel}
        </div>
        <h1 style={{ fontSize: 22 }}>{exerciseTitle}</h1>
      </div>

      {task && isChoiceExerciseTask(task) && (
        <>
          <PromptCard label={promptLabel} prompt={task.prompt} />
          <MultipleChoiceExerciseView
            choices={task.choices}
            selectedChoiceId={selectedChoiceId}
            correctChoiceId={phase === "feedback" ? task.correctChoiceId : null}
            disabled={phase === "feedback"}
            onSelect={onSelectAnswer}
          />
        </>
      )}

      {task && isProductionExerciseTask(task) && (
        <>
          <PromptCard label={promptLabel} prompt={task.prompt} />
          <TypeInExerciseView
            value={typedAnswer}
            disabled={phase === "feedback"}
            onChange={onTypedAnswerChange}
            onSubmit={onSubmitTypedAnswer}
          />
        </>
      )}

      {task && isContextExerciseTask(task) && (
        <>
          <PromptCard label={promptLabel} prompt={task.prompt} isMaskedWord />
          <TypeInExerciseView
            value={typedAnswer}
            disabled={phase === "feedback"}
            onChange={onTypedAnswerChange}
            onSubmit={onSubmitTypedAnswer}
          />
        </>
      )}

      {phase === "feedback" && isCorrect !== null && (
        <AnswerFeedback
          isCorrect={isCorrect}
          correctAnswerLabel={correctAnswerLabel}
          onContinue={onContinue}
        />
      )}
    </div>
  );
}
