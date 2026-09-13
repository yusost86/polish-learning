interface AnswerFeedbackProps {
  isCorrect: boolean;
  correctAnswerLabel: string;
  onContinue: () => void;
}

export function AnswerFeedback({ isCorrect, correctAnswerLabel, onContinue }: AnswerFeedbackProps) {
  return (
    <section
      style={{
        background: isCorrect ? "rgba(111, 191, 154, 0.12)" : "rgba(224, 122, 99, 0.12)",
        border: `1px solid ${isCorrect ? "var(--good)" : "var(--bad)"}`,
        borderRadius: "var(--radius-m)",
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 16, color: isCorrect ? "var(--good)" : "var(--bad)" }}>
        {isCorrect ? "Правильно!" : "Неправильно."}
      </div>
      {!isCorrect && (
        <div style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.5 }}>
          Правильна відповідь: <strong style={{ color: "var(--text)" }}>{correctAnswerLabel}</strong>
        </div>
      )}
      <button
        onClick={onContinue}
        style={{
          padding: "12px 16px",
          borderRadius: "var(--radius-s)",
          background: "var(--gold)",
          color: "#2a1e0c",
          fontWeight: 700,
          fontSize: 15,
        }}
      >
        Далі
      </button>
    </section>
  );
}
