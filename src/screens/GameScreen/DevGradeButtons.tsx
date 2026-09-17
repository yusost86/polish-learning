interface DevGradeButtonsProps {
  onGrade: (answer: string) => void;
  correctAnswer: string;
}

export function DevGradeButtons({ onGrade, correctAnswer }: DevGradeButtonsProps) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
      <button
        type="button"
        onClick={() => onGrade(correctAnswer)}
        style={{
          flex: 1,
          padding: "13px 16px",
          borderRadius: "var(--radius-s)",
          background: "rgba(111, 191, 154, 0.18)",
          border: "1px solid var(--good)",
          color: "var(--good)",
          fontWeight: 700,
          fontSize: 15,
        }}
      >
        Вірно
      </button>
      <button
        type="button"
        onClick={() => onGrade("")}
        style={{
          flex: 1,
          padding: "13px 16px",
          borderRadius: "var(--radius-s)",
          background: "rgba(224, 122, 99, 0.18)",
          border: "1px solid var(--bad)",
          color: "var(--bad)",
          fontWeight: 700,
          fontSize: 15,
        }}
      >
        Невірно
      </button>
    </div>
  );
}
